import React, { useRef, useState } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_MB } from '../../constants/technicalQuery';
import { formatBytes } from '../../utils/tqFormatters';

export default function FileUpload({ files, onChange, multiple = true, maxFiles = 5 }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const addFiles = (newFiles) => {
    setError('');
    const list = Array.from(newFiles);
    const tooBig = list.find((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      setError(`${tooBig.name} exceeds the ${MAX_FILE_SIZE_MB}MB limit`);
      return;
    }
    const combined = [...files, ...list].slice(0, maxFiles);
    if (files.length + list.length > maxFiles) setError(`You can attach up to ${maxFiles} files`);
    onChange(combined);
  };

  const removeAt = (idx) => onChange(files.filter((_, i) => i !== idx));

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-gray-300 dark:border-slate-700 hover:border-brand-400'
        }`}
      >
        <UploadCloud className="text-gray-400" size={28} />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="text-brand-700 dark:text-brand-400 font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-400">PNG, JPG, JPEG, PDF, DOCX, ZIP up to {MAX_FILE_SIZE_MB}MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((file, idx) => (
            <li key={`${file.name}-${idx}`} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-slate-800/60 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 min-w-0">
                <FileIcon size={15} className="text-gray-400 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-gray-400 text-xs shrink-0">{formatBytes(file.size)}</span>
              </span>
              <button onClick={(e) => { e.stopPropagation(); removeAt(idx); }} className="text-gray-400 hover:text-red-600 shrink-0">
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
