import React, { useState } from 'react';
import { 
  History, 
  UploadCloud, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  Clock, 
  AlertOctagon,
  FileCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RECENT_ACTIVITIES } from '../data/dailyAllotmentDummyData';

export default function RecentActivity() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'upload':
        return <UploadCloud size={14} className="text-blue-600" />;
      case 'qc':
      case 'qc_complete':
        return <FileCheck size={14} className="text-indigo-600" />;
      case 'download':
        return <Download size={14} className="text-indigo-600" />;
      case 'completed':
      case 'all_completed':
        return <CheckCircle2 size={14} className="text-emerald-600" />;
      case 'wip':
        return <Clock size={14} className="text-amber-600" />;
      case 'rework':
        return <RefreshCw size={14} className="text-rose-600" />;
      case 'delay':
      case 'status_change':
        return <AlertOctagon size={14} className="text-orange-600" />;
      default:
        return <Clock size={14} className="text-blue-600" />;
    }
  };

  const getActivityIconBg = (type) => {
    switch (type) {
      case 'upload':
        return '#eff6ff';
      case 'qc':
      case 'qc_complete':
      case 'completed':
      case 'all_completed':
        return '#ecfdf5';
      case 'download':
        return '#e0e7ff';
      case 'wip':
        return '#fffbeb';
      case 'rework':
      case 'delay':
      case 'status_change':
        return '#fef2f2';
      default:
        return '#f1f5f9';
    }
  };

  const filteredActivities = RECENT_ACTIVITIES.filter((act) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'downloads') return act.category === 'downloads' || act.type === 'download';
    if (activeCategory === 'uploads') return act.category === 'uploads' || act.type === 'upload';
    if (activeCategory === 'completed') return act.category === 'completed' || act.type === 'completed';
    if (activeCategory === 'rework') return act.category === 'rework' || act.type === 'rework';
    if (activeCategory === 'qc') return act.category === 'qc' || act.type === 'qc';
    if (activeCategory === 'status_change') return act.category === 'status_change' || act.type === 'delay';
    return true;
  });

  const displayedActivities = isExpanded ? filteredActivities : filteredActivities.slice(0, 7);

  return (
    <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="dashboard-card-header" style={{ marginBottom: '10px' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={17} className="text-blue-600" />
          Recent Activity
        </h3>
        <span className="card-badge-info">Live Production Log</span>
      </div>

      {/* Activity Filter Tabs */}
      <div className="activity-filter-tabs" style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'downloads', label: 'Downloads' },
          { key: 'uploads', label: 'Uploads' },
          { key: 'completed', label: 'Completed' },
          { key: 'rework', label: 'Rework' },
          { key: 'qc', label: 'QC' },
          { key: 'status_change', label: 'Status' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`activity-tab-btn ${activeCategory === tab.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="activity-timeline" style={{ flex: 1, maxHeight: isExpanded ? '420px' : '230px', overflowY: 'auto', paddingRight: '4px' }}>
        {displayedActivities.length > 0 ? (
          displayedActivities.map((act) => (
            <div key={act.id} className="activity-item">
              <div 
                className="activity-icon-bubble"
                style={{ backgroundColor: getActivityIconBg(act.type) }}
              >
                {getActivityIcon(act.type)}
              </div>

              <div className="activity-content">
                <div className="activity-header">
                  <span className="activity-emp-name">{act.employee}</span>
                  <span className="activity-time">{act.time}</span>
                </div>
                <div className="activity-text">
                  {act.action} <span className="activity-target">{act.target}</span>
                </div>
                <div>
                  <span className="activity-project-tag">{act.project}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: '#94a3b8', fontSize: '12px', padding: '16px 0', textAlign: 'center' }}>
            No recent activity recorded for this category.
          </div>
        )}
      </div>

      {filteredActivities.length > 7 && (
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '8px', textAlign: 'center' }}>
          <button
            type="button"
            className="btn-text-clear"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}
          >
            {isExpanded ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Show Less <ChevronUp size={12} />
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                View More ({filteredActivities.length - 7} more) <ChevronDown size={12} />
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
