import React from 'react';
import { STATUS_META, STATUS_COLOR_CLASSES } from '../../constants/technicalQuery';
import { titleCase } from '../../utils/tqFormatters';

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: titleCase(status), color: 'gray' };
  const classes = STATUS_COLOR_CLASSES[meta.color] || STATUS_COLOR_CLASSES.gray;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${classes}`}>
      {meta.label}
    </span>
  );
}
