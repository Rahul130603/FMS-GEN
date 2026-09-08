import { INITIAL_MY_PROJECTS, INITIAL_INCOMING_PROJECTS, RECENT_ACTIVITIES } from '../data/mockData';

// Simulated latency for production-realistic async behavior
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

class ReportService {
  /**
   * Fetch assigned projects for current user
   */
  async getMyProjects() {
    await delay(250);
    // In future backend integration, this will call: return api.get('/api/reports/my-projects')
    return [...INITIAL_MY_PROJECTS];
  }

  /**
   * Fetch incoming intake projects
   */
  async getIncomingProjects() {
    await delay(250);
    // In future backend integration, this will call: return api.get('/api/reports/incoming')
    return [...INITIAL_INCOMING_PROJECTS];
  }

  /**
   * Fetch recent publishing activities
   */
  async getRecentActivities() {
    await delay(200);
    return [...RECENT_ACTIVITIES];
  }

  /**
   * Assign an incoming project to a team/user
   */
  async assignProject(projectId, assignmentData) {
    await delay(400);
    // Future backend API: return api.post(`/api/projects/${projectId}/assign`, assignmentData)
    return {
      success: true,
      projectId,
      ...assignmentData,
      status: 'Assigned',
      assignedAt: new Date().toISOString()
    };
  }
}

export const reportService = new ReportService();


