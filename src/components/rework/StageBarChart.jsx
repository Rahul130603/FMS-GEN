import React from 'react';
import Chart from 'react-apexcharts';

export default function StageBarChart({ stageWise }) {
  if (!stageWise) return null;

  const rework = [stageWise.scan.rework, stageWise.qc.rework, stageWise.qag.rework];
  const corrected = [stageWise.scan.corrected, stageWise.qc.corrected, stageWise.qag.corrected];
  const reject = [stageWise.scan.reject, stageWise.qc.reject, stageWise.qag.reject];

  const options = {
    chart: { type: 'bar', height: 170, toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '42%', borderRadius: 2 }
    },
    dataLabels: {
      enabled: true,
      style: { fontSize: '9px', fontWeight: 700 },
      offsetY: -15
    },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: ['Scanning', 'QC Audit', 'QAG Approval'],
      labels: { style: { fontSize: '10px', fontWeight: 600, colors: '#64748b' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { show: false },
    fill: { opacity: 1 },
    colors: ['#f59e0b', '#10b981', '#ef4444'],
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '10px', markers: { radius: 12 } },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 3, yaxis: { lines: { show: true } } }
  };

  const series = [
    { name: 'Rework Load', data: rework },
    { name: 'Corrected', data: corrected },
    { name: 'Strict Reject', data: reject }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Stage-wise Defect Breakdown</h3>
        <span className="text-2xs font-medium text-slate-400">Scan vs QC vs QAG</span>
      </div>

      {rework.every(v => v === 0) && corrected.every(v => v === 0) && reject.every(v => v === 0) ? (
        <div className="h-[170px] flex items-center justify-center text-xs text-slate-400">
          No stage defect data available.
        </div>
      ) : (
        <div>
          <Chart options={options} series={series} type="bar" height={170} />
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500 font-medium">
        <span>Highest defect volume: <strong className="text-slate-800">Scan Origin</strong></span>
        <span>Resolution rate: <strong className="text-emerald-600 font-bold">~80%</strong></span>
      </div>
    </div>
  );
}
