import React from 'react';
import DailyAllotmentStatus from '../components/DailyAllotmentStatus';
import '../styles/daily-allotment.css';

export function DailyAllotmentPage() {
  return (
    <div className="daily-allotment-page-container">
      <DailyAllotmentStatus />
    </div>
  );
}

export default DailyAllotmentPage;
