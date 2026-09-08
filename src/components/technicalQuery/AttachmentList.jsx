import React, { useState } from 'react';
import { FileText, Image as ImageIcon, FileArchive, FileType2, Download, DownloadCloud } from 'lucide-react';
import { formatBytes, formatDate } from '../../utils/tqFormatters';
import { technicalQueryApi } from '../../services/technicalQueryApi';

function iconFor(mime) {
  if (mime?.startsWith('image/')) return ImageIcon;
  if (mime === 'application/pdf') return FileText;
  if (mime?.includes('zip')) return FileArchive;
  return FileType2;
}

export default function AttachmentList({ queryId, queryNumber, attachments = [] }) {
  const [downloading, setDownloading] = useState(null);

  if (!attachments.length) {
    return <p className="text-sm text-gray-400">No attachments.</p>;
  }

  const handleDownload = async (att) => {
    setDownloading(att.id);
    try {
      await technicalQueryApi.downloadAttachment(queryId, att.id, att.original_name);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <ul className="space-y-2">
        {attachments.map((att) => {
          const Icon = iconFor(att.mime_type);
          return (
            <li key={att.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon size={17} className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-100 truncate">{att.original_name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(att.size_bytes)} · {formatDate(att.uploaded_at)}</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(att)}
                disabled={downloading === att.id}
                className="btn-outline !px-2 !py-1.5 shrink-0"
                aria-label={`Download ${att.original_name}`}
              >
                <Download size={14} />
              </button>
            </li>
          );
        })}
      </ul>
      {attachments.length > 1 && (
        <button
          onClick={() => technicalQueryApi.downloadAllAttachments(queryId, queryNumber)}
          className="btn-secondary mt-3 !py-1.5 text-xs"
        >
          <DownloadCloud size={14} /> Download all as .zip
        </button>
      )}
    </div>
  );
}
