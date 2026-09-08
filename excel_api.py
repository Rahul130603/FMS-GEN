import csv, io, json, os, re, threading, zipfile
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import xml.etree.ElementTree as ET

HOST=os.environ.get('FILEFLOW_EXCEL_HOST','127.0.0.1')
PORT=int(os.environ.get('FILEFLOW_EXCEL_PORT','8770'))
WORKBOOK=Path(os.environ.get('FILEFLOW_EXCEL_PATH',r'C:\Users\Admin\Downloads\PETER LANG_MASTER SHEET.xlsx'))
OVERLAY=Path(__file__).with_name('peter_lang_edits.json')
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
RID='{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
LOCK=threading.RLock(); CACHE={}

def col_index(ref):
    letters=re.match(r'[A-Z]+',ref or 'A').group()
    value=0
    for ch in letters:value=value*26+ord(ch)-64
    return value-1

def clean_number(value):
    if not value:return ''
    if re.fullmatch(r'[-+]?\d+(\.0+)?',value):return value.split('.')[0]
    if re.fullmatch(r'[-+]?\d+(\.\d+)?[Ee][+-]?\d+',value):
        try:return str(int(float(value)))
        except ValueError:return value
    return value

def workbook_meta():
    with zipfile.ZipFile(WORKBOOK) as z:
        wb=ET.fromstring(z.read('xl/workbook.xml')); rel=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        relations={x.attrib['Id']:x.attrib['Target'] for x in rel}
        sheets=[]
        for sheet in wb.find('m:sheets',NS):
            target=relations[sheet.attrib[RID]]
            target=target.lstrip('/') if target.startswith('/') else 'xl/'+target.replace('../','')
            sheets.append({'name':sheet.attrib['name'],'target':target})
        shared=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            root=ET.fromstring(z.read('xl/sharedStrings.xml'))
            shared=[''.join(t.text or '' for t in item.iter('{%s}t'%NS['m'])) for item in root]
        return sheets,shared

SHEETS,SHARED=workbook_meta()
def load_overlay():
    try:return json.loads(OVERLAY.read_text(encoding='utf-8'))
    except Exception:return {}
EDITS=load_overlay()
def save_overlay():OVERLAY.write_text(json.dumps(EDITS,ensure_ascii=False,indent=2),encoding='utf-8')

def load_sheet(name):
    with LOCK:
        if name in CACHE:return CACHE[name]
        meta=next((x for x in SHEETS if x['name']==name),None)
        if not meta:raise ValueError('Unknown sheet')
        rows=[]
        with zipfile.ZipFile(WORKBOOK) as z:
            root=ET.fromstring(z.read(meta['target']))
            for node in root.findall('.//m:sheetData/m:row',NS):
                cells={}
                for cell in node.findall('m:c',NS):
                    idx=col_index(cell.attrib.get('r','A1')); kind=cell.attrib.get('t'); value=''
                    if kind=='inlineStr':value=''.join(t.text or '' for t in cell.iter('{%s}t'%NS['m']))
                    else:
                        v=cell.find('m:v',NS); value='' if v is None else (v.text or '')
                        if kind=='s' and value:value=SHARED[int(value)]
                        elif kind not in ('str','b'):value=clean_number(value)
                    cells[idx]=value
                if cells:
                    width=max(cells)+1; rows.append([cells.get(i,'') for i in range(width)])
        headers=[str(x).strip() or f'Column {i+1}' for i,x in enumerate(rows[0])] if rows else []
        width=len(headers); data=[]
        for i,row in enumerate(rows[1:],start=2):
            row=(row+['']*width)[:width]
            data.append({'rowNumber':i,'values':row})
        CACHE[name]={'headers':headers,'rows':data};return CACHE[name]

def apply_edits(name,row):
    values=list(row['values'])
    for key,value in EDITS.get(name,{}).get(str(row['rowNumber']),{}).items():
        idx=int(key)
        if idx<len(values):values[idx]=value
    return {'rowNumber':row['rowNumber'],'values':values}

class Handler(BaseHTTPRequestHandler):
    def log_message(self,fmt,*args):pass
    def cors(self):
        self.send_header('Access-Control-Allow-Origin','*');self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS');self.send_header('Access-Control-Allow-Headers','Content-Type')
    def json(self,obj,status=200):
        raw=json.dumps(obj,ensure_ascii=False).encode();self.send_response(status);self.cors();self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
    def do_OPTIONS(self):self.send_response(204);self.cors();self.end_headers()
    def do_GET(self):
        try:
            parsed=urlparse(self.path);query=parse_qs(parsed.query)
            if parsed.path=='/health':return self.json({'ok':True,'workbook':str(WORKBOOK),'sheets':len(SHEETS)})
            if parsed.path=='/summary':return self.json({'ok':True,'metrics':{'totalClientBooks':105576,'uniqueBooks':48537,'scannedBooks':30400,'delivered':45609,'completion':94.7},'sheets':[x['name'] for x in SHEETS]})
            if parsed.path=='/sheet':
                name=query.get('name',['UPDATED INVENTORY'])[0];page=max(1,int(query.get('page',['1'])[0]));size=min(100,max(10,int(query.get('size',['25'])[0])));search=query.get('search',[''])[0].lower().strip();sheet=load_sheet(name)
                rows=(apply_edits(name,x) for x in sheet['rows']);rows=[x for x in rows if not search or search in ' '.join(map(str,x['values'])).lower()]
                start=(page-1)*size;return self.json({'ok':True,'name':name,'headers':sheet['headers'],'rows':rows[start:start+size],'total':len(rows),'page':page,'size':size,'pages':max(1,(len(rows)+size-1)//size)})
            if parsed.path=='/export':
                name=query.get('name',['UPDATED INVENTORY'])[0];sheet=load_sheet(name);out=io.StringIO();writer=csv.writer(out);writer.writerow(sheet['headers']);writer.writerows(apply_edits(name,x)['values'] for x in sheet['rows']);raw=out.getvalue().encode('utf-8-sig');self.send_response(200);self.cors();self.send_header('Content-Type','text/csv');self.send_header('Content-Disposition',f'attachment; filename="{name}.csv"');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw);return
            return self.json({'ok':False,'detail':'Not found'},404)
        except Exception as exc:return self.json({'ok':False,'detail':str(exc)},400)
    def do_POST(self):
        try:
            size=int(self.headers.get('Content-Length','0'));body=json.loads(self.rfile.read(size) or b'{}')
            if self.path=='/update':
                name=str(body['sheet']);row=str(int(body['rowNumber']));column=str(int(body['column']));value=str(body.get('value',''));load_sheet(name)
                with LOCK:EDITS.setdefault(name,{}).setdefault(row,{})[column]=value;save_overlay()
                return self.json({'ok':True,'sheet':name,'rowNumber':int(row),'column':int(column),'value':value})
            if self.path=='/reset-edits':
                with LOCK:EDITS.clear();save_overlay()
                return self.json({'ok':True})
            return self.json({'ok':False,'detail':'Not found'},404)
        except Exception as exc:return self.json({'ok':False,'detail':str(exc)},400)

if __name__=='__main__':
    if not WORKBOOK.exists():raise SystemExit(f'Workbook not found: {WORKBOOK}')
    print(f'Peter Lang Excel API: http://{HOST}:{PORT}');ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
