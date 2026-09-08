import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { PRIORITY_LABELS, PRIORITY_COLOR_CLASSES } from '../../constants/technicalQuery';

export default function PriorityBadge({ priority }) {
  const classes = PRIORITY_COLOR_CLASSES[priority] || PRIORITY_COLOR_CLASSES.normal;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${classes}`}>
      {priority === 'urgent' && <AlertTriangle size={12} />}
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}
