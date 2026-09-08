import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ErrorReport, ErrorFilters, ErrorStatus, ProjectType, TimelineEvent, ErrorComment } from '../types/errors';
import { Priority } from '../types/common';
import { INITIAL_ERRORS } from '../data/initialErrors';
import { useToast } from './ToastContext';
import { removeUploadedFile } from '../utils/fileStorage';

export type SavedViewType = 'all' | 'my_issues' | 'high_priority' | 'open' | 'overdue' | 'resolved';

interface ErrorContextType {
  errors: ErrorReport[];
  filteredErrors: ErrorReport[];
  selectedError: ErrorReport | null;
  activeView: SavedViewType;
  filters: ErrorFilters;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  metrics: {
    total: number;
    open: number;
    inProgress: number;
    highPriority: number;
    resolved: number;
    overdue: number;
    myIssues: number;
  };
  viewCounts: {
    all: number;
    my_issues: number;
    high_priority: number;
    open: number;
    overdue: number;
    resolved: number;
  };
  setActiveView: (view: SavedViewType) => void;
  setFilters: React.Dispatch<React.SetStateAction<ErrorFilters>>;
  updateFilter: <K extends keyof ErrorFilters>(key: K, value: ErrorFilters[K]) => void;
  clearFilters: () => void;
  setSelectedError: (error: ErrorReport | null) => void;
  selectNextError: () => void;
  selectPrevError: () => void;
  setSort: (field: string) => void;
  createError: (errorData: Partial<ErrorReport>) => string;
  updateError: (id: string, updates: Partial<ErrorReport>) => void;
  changeStatus: (id: string, newStatus: ErrorStatus, notes?: string, user?: string) => void;
  assignError: (id: string, assignee: string, team?: string, user?: string) => void;
  resolveError: (id: string, resolutionNotes: string, fixedBy: string, fixedDate?: string) => void;
  verifyError: (id: string, verificationNotes: string, verifiedBy: string, markClosed?: boolean) => void;
  reopenError: (id: string, reason: string, user: string) => void;
  deleteError: (id: string) => void;
  addComment: (errorId: string, content: string, author: string, role: string) => void;
  filterByMetricStrip: (status: 'all' | 'open' | 'inProgress' | 'highPriority' | 'resolved' | 'overdue') => void;
}

const initialFilters: ErrorFilters = {
  search: '',
  status: 'All',
  priority: 'All',
  projectType: 'All',
  assignedTo: 'All',
  reportedBy: 'All'
};

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

const STORAGE_KEY = 'pubvantage_error_reports_v7';
const CURRENT_USER = 'Priya S.'; // Current user session

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  const [errors, setErrors] = useState<ErrorReport[]>(() => {
    // Clear legacy storage keys containing hardcoded sample data
    try {
      ['pubvantage_error_reports_v6', 'pubvantage_error_reports_v5', 'pubvantage_error_reports_v4', 'pubvantage_error_reports_v3', 'pubvantage_error_reports_v2', 'pubvantage_error_reports_v1'].forEach((k) => {
        localStorage.removeItem(k);
      });
    } catch {}

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ErrorReport[];
        const isSampleError = (e: any) => {
          const id = String(e.id || '');
          return id.startsWith('ERR-001') ||
            e.attachments?.some((att: any) => att.source === 'sample') ||
            e.serverLocation?.startsWith('/server/') ||
            e.chapter?.includes('Mindfulness in Space') ||
            e.description?.includes('Total Area Coverage') ||
            e.description?.includes('Skew distortion') ||
            e.description?.includes('Broken internal cross-reference') ||
            e.description?.includes('OCR baseline drift');
        };
        return parsed.filter(e => !isSampleError(e));
      }
    } catch (e) {
      console.error('Failed to parse saved errors:', e);
    }
    return [];
  });

  const [selectedError, setSelectedErrorState] = useState<ErrorReport | null>(null);
  const [activeView, setActiveViewState] = useState<SavedViewType>('all');
  const [filters, setFilters] = useState<ErrorFilters>(initialFilters);
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sync to localStorage without overflowing quota (actual binary files stored in IndexedDB)
  useEffect(() => {
    try {
      const sanitizedErrors = errors.map((err) => ({
        ...err,
        attachments: err.attachments.map((att) => {
          const isInitialSample = INITIAL_ERRORS.some((e) => e.attachments?.some((ea) => ea.id === att.id));
          const isUpload = att.source === 'upload' || (!isInitialSample && att.source !== 'sample');
          if (isUpload) {
            const { file, ...rest } = att;
            const safeFileData = att.fileData && !att.fileData.includes('PubVantage') && att.fileData.length < 100000 ? att.fileData : undefined;
            return {
              ...rest,
              fileData: safeFileData,
              source: 'upload' as const,
              storageKey: att.storageKey,
              fileId: att.fileId || att.id
            };
          }
          return att;
        })
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedErrors));
    } catch (e) {
      console.error('Failed to save errors to localStorage:', e);
    }
  }, [errors]);

  // Ensure an item is selected by default on load
  useEffect(() => {
    if (!selectedError && errors.length > 0) {
      setSelectedErrorState(errors[0]);
    } else if (selectedError) {
      const updated = errors.find((e) => e.id === selectedError.id);
      if (updated) {
        setSelectedErrorState(updated);
      }
    }
  }, [errors]);

  const setSelectedError = useCallback((error: ErrorReport | null) => {
    setSelectedErrorState(error);
  }, []);

  const updateFilter = useCallback(<K extends keyof ErrorFilters>(key: K, value: ErrorFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setActiveViewState('all');
  }, []);

  const setActiveView = useCallback((view: SavedViewType) => {
    setActiveViewState(view);
  }, []);

  const setSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const today = new Date(2026, 8, 5); // Sep 5, 2026

    let open = 0;
    let inProgress = 0;
    let highPriority = 0;
    let resolved = 0;
    let overdue = 0;
    let myIssues = 0;

    errors.forEach((err) => {
      if (err.status === 'Open' || err.status === 'Reopened') open++;
      if (err.status === 'In Progress') inProgress++;
      if ((err.priority === 'High' || err.priority === 'Critical') && err.status !== 'Closed' && err.status !== 'Verified') {
        highPriority++;
      }
      if (err.status === 'Resolved' || err.status === 'Verified') resolved++;
      if (err.assignedTo.includes(CURRENT_USER)) myIssues++;

      if (err.status !== 'Closed' && err.status !== 'Resolved' && err.status !== 'Verified' && err.dueDate) {
        const parts = err.dueDate.split('-');
        if (parts.length === 3) {
          const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          if (due < today) {
            overdue++;
          }
        }
      }
    });

    return {
      total: errors.length,
      open,
      inProgress,
      highPriority,
      resolved,
      overdue,
      myIssues
    };
  }, [errors]);

  const viewCounts = useMemo(() => {
    return {
      all: metrics.total,
      my_issues: metrics.myIssues,
      high_priority: metrics.highPriority,
      open: metrics.open,
      overdue: metrics.overdue,
      resolved: metrics.resolved
    };
  }, [metrics]);

  const filterByMetricStrip = useCallback((status: 'all' | 'open' | 'inProgress' | 'highPriority' | 'resolved' | 'overdue') => {
    if (status === 'all') {
      setActiveViewState('all');
      setFilters(initialFilters);
    } else if (status === 'open') {
      setActiveViewState('open');
      setFilters({ ...initialFilters, status: 'Open' });
    } else if (status === 'inProgress') {
      setActiveViewState('all');
      setFilters({ ...initialFilters, status: 'In Progress' });
    } else if (status === 'highPriority') {
      setActiveViewState('high_priority');
      setFilters({ ...initialFilters, priority: 'High' });
    } else if (status === 'resolved') {
      setActiveViewState('resolved');
      setFilters({ ...initialFilters, status: 'Resolved' });
    } else if (status === 'overdue') {
      setActiveViewState('overdue');
      setFilters(initialFilters);
    }
  }, []);

  // Filtered & Sorted Errors
  const filteredErrors = useMemo(() => {
    const today = new Date(2026, 8, 5);

    return errors
      .filter((item) => {
        // Saved View Filter
        if (activeView === 'my_issues' && !item.assignedTo.includes(CURRENT_USER)) {
          return false;
        }
        if (activeView === 'high_priority' && item.priority !== 'High' && item.priority !== 'Critical') {
          return false;
        }
        if (activeView === 'open' && item.status !== 'Open' && item.status !== 'Reopened') {
          return false;
        }
        if (activeView === 'resolved' && item.status !== 'Resolved' && item.status !== 'Verified') {
          return false;
        }
        if (activeView === 'overdue') {
          if (item.status === 'Closed' || item.status === 'Resolved' || item.status === 'Verified') return false;
          if (!item.dueDate) return false;
          const parts = item.dueDate.split('-');
          if (parts.length === 3) {
            const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            if (due >= today) return false;
          }
        }

        // Search
        if (filters.search.trim()) {
          const query = filters.search.toLowerCase();
          const matchId = item.id.toLowerCase().includes(query);
          const matchType = item.projectType.toLowerCase().includes(query);
          const matchIsbn = item.isbnNumber.toLowerCase().includes(query);
          const matchChapter = item.chapter.toLowerCase().includes(query);
          const matchServer = item.serverLocation.toLowerCase().includes(query);
          const matchDesc = item.description.toLowerCase().includes(query);
          const matchExpected = item.expectedResult.toLowerCase().includes(query);
          const matchActual = item.actualResult.toLowerCase().includes(query);
          const matchReporter = item.reportedBy.toLowerCase().includes(query);
          const matchAssignee = item.assignedTo.toLowerCase().includes(query);

          if (
            !matchId &&
            !matchType &&
            !matchIsbn &&
            !matchChapter &&
            !matchServer &&
            !matchDesc &&
            !matchExpected &&
            !matchActual &&
            !matchReporter &&
            !matchAssignee
          ) {
            return false;
          }
        }

        // Status
        if (filters.status !== 'All' && item.status !== filters.status) {
          return false;
        }

        // Priority
        if (filters.priority !== 'All' && item.priority !== filters.priority) {
          return false;
        }

        // Project Type
        if (filters.projectType !== 'All' && item.projectType !== filters.projectType) {
          return false;
        }

        // Assigned To
        if (filters.assignedTo !== 'All' && item.assignedTo !== filters.assignedTo) {
          return false;
        }

        // Reported By
        if (filters.reportedBy !== 'All' && item.reportedBy !== filters.reportedBy) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField as keyof ErrorReport] ?? '';
        let valB: any = b[sortField as keyof ErrorReport] ?? '';

        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
  }, [errors, activeView, filters, sortField, sortDirection]);

  // Keep selected error valid
  useEffect(() => {
    if (filteredErrors.length > 0) {
      if (!selectedError || !filteredErrors.some((e) => e.id === selectedError.id)) {
        setSelectedErrorState(filteredErrors[0]);
      }
    } else {
      setSelectedErrorState(null);
    }
  }, [filteredErrors]);

  const selectNextError = useCallback(() => {
    if (!selectedError || filteredErrors.length === 0) return;
    const currentIndex = filteredErrors.findIndex((e) => e.id === selectedError.id);
    if (currentIndex < filteredErrors.length - 1) {
      setSelectedErrorState(filteredErrors[currentIndex + 1]);
    }
  }, [selectedError, filteredErrors]);

  const selectPrevError = useCallback(() => {
    if (!selectedError || filteredErrors.length === 0) return;
    const currentIndex = filteredErrors.findIndex((e) => e.id === selectedError.id);
    if (currentIndex > 0) {
      setSelectedErrorState(filteredErrors[currentIndex - 1]);
    }
  }, [selectedError, filteredErrors]);

  const createError = useCallback((errorData: Partial<ErrorReport>): string => {
    const maxNum = errors.reduce((acc, curr) => {
      const match = curr.id.match(/ERR-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > acc ? num : acc;
      }
      return acc;
    }, 125);

    const newId = `ERR-00${maxNum + 1}`;
    const formattedTimestamp = '2026-09-05 09:45';

    const newReport: ErrorReport = {
      id: newId,
      projectType: errorData.projectType || 'Scan',
      chapter: errorData.chapter || 'Chapter 01: Introduction',
      serverLocation: errorData.serverLocation || '/server/scan/batch-1400/ch01.xhtml',
      isbnNumber: errorData.isbnNumber || '978-93-12345-67-8',
      description: errorData.description || '',
      expectedResult: errorData.expectedResult || '',
      actualResult: errorData.actualResult || '',
      reportedBy: errorData.reportedBy || 'Priya S.',
      source: errorData.source || 'QA',
      assignedTo: errorData.assignedTo || 'Priya S.',
      team: errorData.team || 'Accessibility Team',
      priority: errorData.priority || 'High',
      dueDate: errorData.dueDate || '2026-09-09',
      status: errorData.status || 'Open',
      attachments: errorData.attachments || [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: formattedTimestamp,
          title: `Issue reported by ${errorData.reportedBy || 'Priya S.'}`,
          user: errorData.reportedBy || 'Priya S.',
          role: errorData.team || 'QA Team',
          details: 'Initial report filed in issue tracker.',
          type: 'report'
        }
      ],
      comments: []
    };

    setErrors((prev) => [newReport, ...prev]);
    setSelectedErrorState(newReport);
    addToast(`Error ${newId} reported successfully.`, `Filed for ${newReport.projectType} (${newReport.isbnNumber})`, 'success');
    return newId;
  }, [errors, addToast]);

  const updateError = useCallback((id: string, updates: Partial<ErrorReport>) => {
    setErrors((prev) =>
      prev.map((err) => {
        if (err.id === id) {
          return { ...err, ...updates };
        }
        return err;
      })
    );
    addToast('Issue updated successfully.', `Updated details for ${id}`, 'success');
  }, [addToast]);

  const changeStatus = useCallback((id: string, newStatus: ErrorStatus, notes?: string, user: string = CURRENT_USER) => {
    setErrors((prev) =>
      prev.map((err) => {
        if (err.id === id) {
          const newEvent: TimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp: '2026-09-05 09:45',
            title: `Status changed to ${newStatus}`,
            user,
            details: notes || `Workflow progressed from ${err.status} to ${newStatus}`,
            type: 'status_change'
          };
          return {
            ...err,
            status: newStatus,
            timeline: [newEvent, ...err.timeline]
          };
        }
        return err;
      })
    );
    addToast('Status updated.', `${id} is now ${newStatus}`, 'success');
  }, [addToast]);

  const assignError = useCallback((id: string, assignee: string, team?: string, user: string = CURRENT_USER) => {
    setErrors((prev) =>
      prev.map((err) => {
        if (err.id === id) {
          const newEvent: TimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp: '2026-09-05 09:45',
            title: `Assigned to ${assignee}`,
            user,
            details: team ? `Assigned to ${team}` : undefined,
            type: 'assignment'
          };
          return {
            ...err,
            assignedTo: assignee,
            team: team || err.team,
            timeline: [newEvent, ...err.timeline]
          };
        }
        return err;
      })
    );
    addToast('Issue assigned.', `${id} assigned to ${assignee}`, 'success');
  }, [addToast]);

  const resolveError = useCallback((id: string, resolutionNotes: string, fixedBy: string, fixedDate: string = '2026-09-05') => {
    setErrors((prev) =>
      prev.map((err) => {
        if (err.id === id) {
          const newEvent: TimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp: '2026-09-05 09:45',
            title: 'Marked as resolved',
            user: fixedBy,
            details: resolutionNotes,
            type: 'resolution'
          };
          return {
            ...err,
            status: 'Resolved',
            resolutionNotes,
            fixedBy,
            fixedDate,
            timeline: [newEvent, ...err.timeline]
          };
        }
        return err;
      })
    );
    addToast('Issue resolved.', `${id} marked as resolved by ${fixedBy}`, 'success');
  }, [addToast]);

  const verifyError = useCallback((id: string, verificationNotes: string, verifiedBy: string, markClosed: boolean = false) => {
    setErrors((prev) =>
      prev.map((err) => {
        if (err.id === id) {
          const targetStatus: ErrorStatus = markClosed ? 'Closed' : 'Verified';
          const newEvent: TimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp: '2026-09-05 09:45',
            title: markClosed ? 'Verified & Closed' : 'Verified by QA',
            user: verifiedBy,
            details: verificationNotes,
            type: 'verification'
          };
          return {
            ...err,
            status: targetStatus,
            verificationNotes,
            verifiedBy,
            verifiedDate: '2026-09-05',
            timeline: [newEvent, ...err.timeline]
          };
        }
        return err;
      })
    );
    addToast('Issue verified.', `${id} verified by QA`, 'success');
  }, [addToast]);

  const reopenError = useCallback((id: string, reason: string, user: string) => {
    setErrors((prev) =>
      prev.map((err) => {
        if (err.id === id) {
          const newEvent: TimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp: '2026-09-05 09:45',
            title: 'Reopened by QA',
            user,
            details: reason,
            type: 'reopen'
          };
          return {
            ...err,
            status: 'Reopened',
            timeline: [newEvent, ...err.timeline]
          };
        }
        return err;
      })
    );
    addToast('Issue reopened.', `${id} reopened for investigation`, 'warning');
  }, [addToast]);

  const deleteError = useCallback((id: string) => {
    setErrors((prev) => {
      const toDelete = prev.find((err) => err.id === id);
      if (toDelete && toDelete.attachments) {
        toDelete.attachments.forEach((att) => {
          if (att.source === 'upload') {
            removeUploadedFile(att.id);
          }
        });
      }
      return prev.filter((err) => err.id !== id);
    });
    addToast('Issue deleted.', `${id} has been removed.`, 'info');
  }, [addToast]);

  const addComment = useCallback((errorId: string, content: string, author: string, role: string) => {
    const newComment: ErrorComment = {
      id: `comment-${Date.now()}`,
      author,
      role,
      createdAt: '2026-09-05 09:45',
      content
    };

    const newTimelineEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: '2026-09-05 09:45',
      title: `Comment from ${author}`,
      user: author,
      role,
      details: content,
      type: 'comment'
    };

    setErrors((prev) =>
      prev.map((err) => {
        if (err.id === errorId) {
          return {
            ...err,
            comments: [...err.comments, newComment],
            timeline: [newTimelineEvent, ...err.timeline]
          };
        }
        return err;
      })
    );
    addToast('Comment posted.', 'Note added to issue discussion.', 'success');
  }, [addToast]);

  return (
    <ErrorContext.Provider
      value={{
        errors,
        filteredErrors,
        selectedError,
        activeView,
        filters,
        sortField,
        sortDirection,
        metrics,
        viewCounts,
        setActiveView,
        setFilters,
        updateFilter,
        clearFilters,
        setSelectedError,
        selectNextError,
        selectPrevError,
        setSort,
        createError,
        updateError,
        changeStatus,
        assignError,
        resolveError,
        verifyError,
        reopenError,
        deleteError,
        addComment,
        filterByMetricStrip
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};

export const useErrors = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrors must be used within an ErrorProvider');
  }
  return context;
};
