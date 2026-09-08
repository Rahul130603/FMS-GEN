import React from 'react';
import Chart from 'react-apexcharts';

export default function DonutChart({ distribution }) {
  if (!distribution) return null;

  const total = distribution.total || (distribution.corrected + distribution.pending + distribution.reject);
  const series = total > 0 ? [distribution.corrected, distribution.pending, distribution.reject] : [1];
  const colors = total > 0 ? ['#10b981', '#f59e0b', '#ef4444'] : ['#e2e8f0'];
  const labels = total > 0 ? ['Corrected', 'Pending', 'Rejected'] : ['None'];

  const options = {
    chart: { type: 'donut', height: 160, animations: { enabled: true } },
    labels: labels,
    colors: colors,
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            value: { show: true, fontSize: '14px', fontWeight: 800, color: '#0f172a', offsetY: 5 },
            total: {
              show: true,
              label: 'Defects',
              fontSize: '11px',
              fontWeight: 700,
              formatter: () => `${total} Total`
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: { enabled: total > 0 },
    stroke: { width: 2, colors: ['#ffffff'] }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Defect Clearance Distribution</h3>
        <span className="text-2xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          {distribution.recovery_rate}% Cleared
        </span>
      </div>

      {total > 0 ? (
        <div className="flex items-center justify-center my-1">
          <Chart options={options} series={series} type="donut" width="100%" height={160} />
        </div>
      ) : (
        <div className="h-[160px] flex items-center justify-center text-xs text-slate-400">
          No defect data available.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
        <div>
          <div className="text-[10px] text-slate-400 font-medium">Passed</div>
          <div className="text-xs font-bold text-emerald-600">{distribution.corrected} ({distribution.recovery_rate}%)</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-medium">Pending</div>
          <div className="text-xs font-bold text-amber-600">{distribution.pending} ({distribution.pending_pct}%)</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-medium">Rejected</div>
          <div className="text-xs font-bold text-rose-600">{distribution.reject}</div>
        </div>
      </div>
    </div>
  );
}
