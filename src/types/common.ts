export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  team: string;
}

export interface BookProject {
  id: string;
  title: string;
  projectCode: string;
  isbn: string;
  edition: string;
  author: string;
  format: 'EPUB 3.2 (Reflowable)' | 'EPUB 3.2 (Fixed-Layout)' | 'EPUB 3.0' | 'Multi-Format (EPUB/PDF/Mobi)';
  status: 'Draft' | 'Typesetting' | 'Conversion' | 'QA & Validation' | 'Sign-off' | 'Published';
  chaptersCount: number;
  coverColor: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string; // e.g. "1.4 MB"
  url?: string;
  fileData?: string; // Data URL or text content for real downloads
  source?: 'upload' | 'sample'; // Explicitly distinguish user upload vs sample demo file
  file?: Blob | File; // In-memory reference to real uploaded File/Blob
  storageKey?: string; // Unique storage reference key
  fileId?: string; // Unique file ID
  uploadedAt: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}
