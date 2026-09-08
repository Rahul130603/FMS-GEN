import React from 'react';
import Chart from 'react-apexcharts';

export default function ReasonDonuts({ reworkReasons, rejectReasons }) {
  const rewSeries = (reworkReasons && reworkReasons.length > 0) ? reworkReasons.map(r => r.count) : [1];
  const rewLabels = (reworkReasons && reworkReasons.length > 0) ? reworkReasons.map(r => r.reason) : ['None'];
  const rewColors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

  const rewOptions = {
    chart: { type: 'donut', height: 160 },
    labels: rewLabels,
    colors: rewColors,
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Rework',
              fontSize: '11px',
              fontWeight: 700,
              formatter: () => `${reworkReasons ? reworkReasons.reduce((a, b) => a + b.count, 0) : 0}`
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', fontSize: '10px', markers: { radius: 12 } }
  };

  const rejSeries = (rejectReasons && rejectReasons.length > 0) ? rejectReasons.map(r => r.count) : [1];
  const rejLabels = (rejectReasons && rejectReasons.length > 0) ? rejectReasons.map(r => r.reason) : ['None'];
  const rejColors = ['#ef4444', '#f97316', '#e11d48', '#94a3b8'];

  const rejOptions = {
    chart: { type: 'donut', height: 160 },
    labels: rejLabels,
    colors: rejColors,
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Reject',
              fontSize: '11px',
              fontWeight: 700,
              formatter: () => `${rejectReasons ? rejectReasons.reduce((a, b) => a + b.count, 0) : 0}`
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', fontSize: '10px', markers: { radius: 12 } }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-2">
      {/* Rework Reasons */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Rework Defect Reasons</h3>
        <Chart options={rewOptions} series={rewSeries} type="donut" height={190} />
      </div>

      {/* Reject Reasons */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Strict Reject Reasons</h3>
        <Chart options={rejOptions} series={rejSeries} type="donut" height={190} />
      </div>
    </div>
  );
}
