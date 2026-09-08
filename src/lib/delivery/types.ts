export type UserRole = 'Admin' | 'Manager' | 'HR' | 'Employee';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserOption {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export interface Milestone {
  id?: number;
  project_id?: number;
  stage: string;
  expected_date?: string;
  actual_completed_date?: string;
  reason?: string;
}

export interface HealthBreakdown {
  score: number;
  category: string;
  risk: string;
  completion: { score: number; max: number; percentage: number; status: { label: string; color: string } };
  daysRemaining: { score: number; max: number; remaining: number | null; label: string; color: string };
  workflow: { score: number; max: number; currentStage: string; completedStages: string[]; remainingStages: string[] };
  priority: { score: number; max: number; level: string };
  missedMilestones: { score: number; max: number; count: number; items: { stage: string; expected_date?: string; delayDays: number }[] };
}

export interface Project {
  id: number;
  project_number: string;
  isbn?: string;
  book_title: string;
  client_name?: string;
  project_type: string;
  department?: string;
  assigned_to?: number;
  assignedEmployee?: { id: number; name: string };
  manager?: number;
  managerUser?: { id: number; name: string };
  priority: string;
  workflow_stage: string;
  completion_percentage: number;
  start_date?: string;
  expected_delivery?: string;
  due_date?: string;
  actual_delivery?: string;
  status: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  milestones?: Milestone[];
  health: HealthBreakdown;
  recommendations: string[];
  delay_days: number;
  remaining_days: number | null;
}

export interface EventRow {
  id: number;
  project_id: number;
  actor?: number;
  event: string;
  old_status?: string;
  new_status?: string;
  note?: string;
  created_at: string;
}

export interface NotificationRow {
  id: number;
  user_id: number;
  project_id?: number;
  type: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

export const PROJECT_TYPES = ['Scanning', 'EPDF', 'POD', 'Cover Development', 'QC', 'QAG', 'Final Delivery', 'Other'];
export const WORKFLOW_STAGES = ['Scanning', 'EPDF', 'POD', 'Cover Development', 'QC', 'QAG', 'Ready for Delivery', 'Delivered'];
export const PROJECT_STATUSES = ['Upcoming', 'Assigned', 'In Progress', 'QC', 'QAG', 'Ready for Delivery', 'Completed', 'Delayed', 'Overdue', 'On Hold', 'Cancelled'];
export const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent', 'Critical'];
