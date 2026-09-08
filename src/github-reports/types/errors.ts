import { Attachment, Priority } from './common';

export type ErrorStatus =
  | 'Open'
  | 'In Progress'
  | 'Resolved'
  | 'Verified'
  | 'Closed'
  | 'Reopened';

export type ProjectType = 'Scan' | 'POD' | 'EPDF' | 'Accessibility';

export type ErrorSource =
  | 'QA'
  | 'Accessibility Review'
  | 'EPUB Validator'
  | 'Production'
  | 'Editor'
  | 'Client'
  | 'Automated Check'
  | 'Other';

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO date string or formatted date
  title: string;
  user: string;
  role?: string;
  details?: string;
  type: 'report' | 'status_change' | 'assignment' | 'resolution' | 'verification' | 'comment' | 'reopen';
}

export interface ErrorComment {
  id: string;
  author: string;
  role: string;
  avatar?: string;
  createdAt: string;
  content: string;
}

export interface ErrorReport {
  id: string; // e.g. "ERR-00125"
  projectType: ProjectType;
  chapter: string;
  serverLocation: string; // e.g. "/server/scan/batch-1400/ch01.xhtml"
  isbnNumber: string; // e.g. "978-0-14-312774-1"

  description: string;
  expectedResult: string;
  actualResult: string;

  reportedBy: string;
  source: ErrorSource;
  assignedTo: string;
  team: string;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  status: ErrorStatus;

  attachments: Attachment[];

  // Resolution & Verification
  resolutionNotes?: string;
  fixedBy?: string;
  fixedDate?: string;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedDate?: string;

  // Activity & Comments
  timeline: TimelineEvent[];
  comments: ErrorComment[];
}

export interface ErrorFilters {
  search: string;
  status: ErrorStatus | 'All';
  priority: Priority | 'All';
  projectType: ProjectType | 'All';
  assignedTo: string;
  reportedBy: string;
  dateRange?: string;
}
