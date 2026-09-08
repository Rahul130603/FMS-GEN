import { Attachment, Priority } from './common';

export type FeedbackStatus =
  | 'New'
  | 'Under Review'
  | 'Planned'
  | 'In Progress'
  | 'Implemented'
  | 'Rejected'
  | 'Duplicate';

export type FeedbackType =
  | 'Suggestion'
  | 'Improvement'
  | 'Feature Request'
  | 'Process Issue'
  | 'Usability Feedback';

export type FeedbackCategory =
  | 'Scanning'
  | 'POD'
  | 'EPDF'
  | 'Accessibility';

export type ProductionImpact = 'Low' | 'Medium' | 'High' | 'Critical';

export interface FeedbackTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  user: string;
  role?: string;
  details?: string;
  type: 'submit' | 'review' | 'plan' | 'progress' | 'implemented' | 'reject' | 'comment';
}

export interface FeedbackCommentReply {
  id: string;
  author: string;
  role: string;
  avatar?: string;
  createdAt: string;
  content: string;
}

export interface FeedbackComment {
  id: string;
  author: string;
  role: string;
  avatar?: string;
  createdAt: string;
  content: string;
  replies?: FeedbackCommentReply[];
}

export interface InternalFeedbackItem {
  id: string; // e.g. "FDB-00084"
  // Section 1: Type
  type: FeedbackType;

  // Section 2: Details
  title: string;
  description: string;
  category: FeedbackCategory;
  relatedModule?: string; // Optional e.g. "Accessibility Checker"
  relatedBook?: string; // Optional e.g. "EPUB Accessibility Handbook"

  // Section 2: Details
  rootCause: string;
  preventiveAction: string;
  correctiveAction: string;

  // Legacy fields (deprecated)
  problemCurrentExperience?: string;
  suggestedImprovement?: string;
  expectedBenefit?: string;
  whoIsAffected?: string;
  frequency?: string; // e.g. "Every EPUB release", "Daily during QA", "Occasional"
  productionImpact?: ProductionImpact;
  priority: Priority;

  // Section 4: Suggested Solution
  suggestedSolution: string;

  // Section 5: Attachments
  attachments: Attachment[];

  // Section 6: Management & Review
  submittedBy: string;
  submittedDate: string; // YYYY-MM-DD
  team?: string;
  assignedTo?: string;
  owner?: string;
  status: FeedbackStatus;
  targetDate?: string;

  // Review & Decision
  reviewer?: string;
  reviewNotes?: string;
  decision?: 'Approved for Roadmap' | 'Deferred' | 'Rejected' | 'Duplicate' | 'Needs More Info';
  decisionDate?: string;

  // History & Discussion
  timeline: FeedbackTimelineEvent[];
  comments: FeedbackComment[];
}

export interface FeedbackFilters {
  search: string;
  status: FeedbackStatus | 'All';
  type: FeedbackType | 'All';
  category: FeedbackCategory | 'All';
  priority: Priority | 'All';
  submittedBy: string;
  assignedTo: string;
  relatedModule: string;
  dateRange: string;
}
