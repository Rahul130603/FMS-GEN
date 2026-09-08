import React from 'react';

/**
 * StatusBadge Component
 * Displays pill-shaped badges with subtle background and colored indicator dot
 * Follows strict design guidelines: no emojis inside table.
 */
export default function StatusBadge({ status, size = 'normal' }) {
  const normalizedStatus = (status || '').toLowerCase().replace(/\s+/g, '');

  let statusClass = 'status-pending';
  let displayLabel = status || 'Pending';

  switch (normalizedStatus) {
    case 'completed':
      statusClass = 'status-completed';
      displayLabel = 'Completed';
      break;
    case 'ontrack':
      statusClass = 'status-ontrack';
      displayLabel = 'On Track';
      break;
    case 'wip':
    case 'inprogress':
      statusClass = 'status-wip';
      displayLabel = 'WIP';
      break;
    case 'pending':
      statusClass = 'status-pending';
      displayLabel = 'Pending';
      break;
    case 'delayed':
      statusClass = 'status-delayed';
      displayLabel = 'Delayed';
      break;
    case 'overdue':
      statusClass = 'status-overdue';
      displayLabel = 'Overdue';
      break;
    case 'noactivity':
      statusClass = 'status-noactivity';
      displayLabel = 'No Activity';
      break;
    case 'rework':
      statusClass = 'status-rework';
      displayLabel = 'Rework';
      break;
    case 'allocated':
    case 'downloaded':
    case 'uploaded':
    case 'qc':
    case 'qag':
      statusClass = 'status-wip';
      displayLabel = status;
      break;
    default:
      statusClass = 'status-pending';
      displayLabel = status;
  }

  return (
    <span className={`status-badge ${statusClass} ${size === 'small' ? 'text-xs py-0.5 px-2' : ''}`}>
      <span className="status-dot" aria-hidden="true" />
      {displayLabel}
    </span>
  );
}
