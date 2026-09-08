import React from 'react';
import { WORKFLOW_STAGES } from '../../lib/delivery/types';

export default function WorkflowTracker({ currentStage }: { currentStage: string }) {
  const idx = WORKFLOW_STAGES.indexOf(currentStage);
  return (
    <div className="workflow-tracker">
      {WORKFLOW_STAGES.map((stage, i) => {
        const done = idx >= 0 && i < idx;
        const active = i === idx;
        const color = done ? '#16a34a' : active ? '#3b82f6' : 'var(--border)';
        return (
          <React.Fragment key={stage}>
            <div className="workflow-step">
              <div className="workflow-dot" style={{ background: color }}>{done ? '✓' : i + 1}</div>
              <div className="workflow-label" style={{ color: active ? 'var(--text)' : undefined, fontWeight: active ? 700 : 400 }}>{stage}</div>
            </div>
            {i < WORKFLOW_STAGES.length - 1 && <div className="workflow-line" style={{ background: done ? '#16a34a' : 'var(--border)' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
