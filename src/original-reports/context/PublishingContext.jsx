import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';
import { RECENT_ACTIVITIES } from '../data/mockData';

const PublishingContext = createContext(null);

export function PublishingProvider({ children }) {
  const [myProjects, setMyProjects] = useState([]);
  const [incomingProjects, setIncomingProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [myPrjs, incomingPrjs, acts] = await Promise.all([
        reportService.getMyProjects(),
        reportService.getIncomingProjects(),
        reportService.getRecentActivities()
      ]);
      setMyProjects(myPrjs);
      setIncomingProjects(incomingPrjs);
      setActivities(acts);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load publishing report data', err);
      setError('Unable to load report data. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle live assignment of an incoming project
  const assignIncomingProject = useCallback(async (projectId, assignmentData) => {
    const result = await reportService.assignProject(projectId, assignmentData);
    if (result.success) {
      setIncomingProjects(prev =>
        prev.map(p => {
          if (p.id === projectId) {
            // Update timeline as well
            const updatedTimeline = p.timeline.map(t => {
              if (t.stage === 'Assigned') {
                return { ...t, status: 'completed', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) };
              }
              if (t.stage === 'Production') {
                return { ...t, status: 'current', date: `Starts ${assignmentData.startDate || 'Tomorrow'}` };
              }
              return t;
            });

            return {
              ...p,
              status: 'Assigned',
              assignedTo: assignmentData.assignedUserName || 'Assigned User',
              assignedTeam: assignmentData.assignedTeam,
              assignedUserId: assignmentData.assignedUserId,
              startDate: assignmentData.startDate,
              dueDate: assignmentData.dueDate || p.dueDate,
              priority: assignmentData.priority || p.priority,
              notes: assignmentData.notes || p.notes,
              timeline: updatedTimeline
            };
          }
          return p;
        })
      );

      // Add a recent activity record
      const targetPrj = incomingProjects.find(p => p.id === projectId);
      const newActivity = {
        id: `ACT-${Date.now()}`,
        timestamp: 'Just now',
        activity: `Project assigned to ${assignmentData.assignedUserName} (${assignmentData.assignedTeam})`,
        project: `${projectId} (${targetPrj ? targetPrj.bookTitle : ''})`,
        status: 'Assigned',
        icon: 'UserCheck',
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        user: 'System'
      };
      setActivities(prev => [newActivity, ...prev]);

      return true;
    }
    return false;
  }, [incomingProjects]);

  return (
    <PublishingContext.Provider
      value={{
        myProjects,
        setMyProjects,
        incomingProjects,
        setIncomingProjects,
        activities,
        loading,
        error,
        lastRefreshed,
        refreshData: loadData,
        assignIncomingProject
      }}
    >
      {children}
    </PublishingContext.Provider>
  );
}

export function usePublishing() {
  const context = useContext(PublishingContext);
  if (!context) {
    throw new Error('usePublishing must be used within a PublishingProvider');
  }
  return context;
}


