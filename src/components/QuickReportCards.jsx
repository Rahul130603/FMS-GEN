import React from 'react';
import { 
  FolderSync, 
  Users, 
  Clock, 
  CheckCircle2, 
  Hourglass, 
  RefreshCw
} from 'lucide-react';

export default function QuickReportCards({ kpis }) {
  const {
    totalAllocated = 0,
    employeesAssigned = 0,
    totalWip = 0,
    totalCompleted = 0,
    totalPending = 0,
    totalRework = 0,
    totalOverdue = 0,
    completionRate = 0,
    comparisons = {}
  } = kpis;

  const cardsData = [
    {
      id: 'allocated',
      label: 'Total Allocated',
      value: totalAllocated,
      unit: 'Files',
      icon: FolderSync,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      comparison: comparisons.allocated || 'Today\'s total allocation',
      trendClass: 'trend-neutral'
    },
    {
      id: 'assigned',
      label: 'Employees Assigned',
      value: employeesAssigned,
      unit: 'Active',
      icon: Users,
      iconBg: '#f0fdfa',
      iconColor: '#0d9488',
      comparison: 'Active production roster',
      trendClass: 'trend-neutral'
    },
    {
      id: 'wip',
      label: 'Work In Progress',
      value: totalWip,
      unit: 'Files',
      icon: Clock,
      iconBg: '#e0f2fe',
      iconColor: '#0284c7',
      comparison: 'Active production queue',
      trendClass: 'trend-neutral'
    },
    {
      id: 'completed',
      label: 'Completed',
      value: totalCompleted,
      unit: 'Files',
      icon: CheckCircle2,
      iconBg: '#ecfdf5',
      iconColor: '#059669',
      comparison: comparisons.completed || '--',
      trendClass: comparisons.completedTrendClass || 'trend-up'
    },
    {
      id: 'pending',
      label: 'Pending',
      value: totalPending,
      unit: 'Files',
      icon: Hourglass,
      iconBg: '#fffbeb',
      iconColor: '#d97706',
      comparison: comparisons.pending || 'Awaiting download/action',
      trendClass: comparisons.pendingTrendClass || 'trend-neutral'
    },
    {
      id: 'rework',
      label: 'Rework Count',
      value: totalRework,
      unit: 'Files',
      icon: RefreshCw,
      iconBg: '#faf5ff',
      iconColor: '#8b5cf6',
      comparison: comparisons.rework || 'QC revisions',
      trendClass: comparisons.reworkTrendClass || 'trend-neutral'
    }
  ];

  return (
    <section className="quick-report-section" aria-label="Quick Report Overview">
      <div className="section-header-block">
        <h2 className="section-title">Quick Report</h2>
        <p className="section-subtitle">Today's production, quality and allocation overview with previous day benchmarks</p>
      </div>

      <div className="quick-report-grid">
        {cardsData.map((card) => {
          const IconComponent = card.icon;
          return (
            <div key={card.id} className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-card-label">{card.label}</span>
                <div 
                  className="kpi-icon-container" 
                  style={{ backgroundColor: card.iconBg, color: card.iconColor }}
                >
                  <IconComponent size={17} />
                </div>
              </div>

              <div className="kpi-card-value">
                {card.value}
                {card.unit && <span className="kpi-unit">{card.unit}</span>}
              </div>

              <div className={`kpi-comparison ${card.trendClass}`}>
                {card.comparison}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
