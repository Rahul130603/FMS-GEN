import React, { useState } from 'react';
import Chart from 'react-apexcharts';

export default function TrendChart({ dailyTrend, displayInfo }) {
  const [activeMetric, setActiveMetric] = useState('rework');

  if (!dailyTrend || dailyTrend.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Trend Analysis</h3>
        <div className="h-[170px] flex items-center justify-center text-xs text-slate-400">
          No trend data available.
        </div>
      </div>
    );
  }

  const categories = dailyTrend.map(d => d.date);

  let seriesData = [];
  let seriesName = 'Rework Files';
  let chartColor = '#f59e0b';
  let chartGradient = ['#fef3c7', '#ffffff'];

  if (activeMetric === 'reject') {
    seriesData = dailyTrend.map(d => d.reject);
    seriesName = 'Reject Files';
    chartColor = '#ef4444';
    chartGradient = ['#fee2e2', '#ffffff'];
  } else if (activeMetric === 'rate') {
    seriesData = dailyTrend.map(d => parseFloat(d.rework_rate));
    seriesName = 'Rework Rate %';
    chartColor = '#3b82f6';
    chartGradient = ['#dbeafe', '#ffffff'];
  } else {
    seriesData = dailyTrend.map(d => d.rework);
    seriesName = 'Rework Files';
    chartColor = '#f59e0b';
    chartGradient = ['#fef3c7', '#ffffff'];
  }

  const options = {
    chart: {
      type: 'area',
      height: 170,
      toolbar: { show: false },
      sparkline: { enabled: false }
    },
    stroke: { curve: 'smooth', width: 2.5 },
    colors: [chartColor],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 95, 100]
      }
    },
    xaxis: {
      categories: categories,
      labels: { style: { fontSize: '10px', colors: '#64748b', fontWeight: 600 } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { fontSize: '10px', colors: '#64748b' },
        formatter: (val) => activeMetric === 'rate' ? `${val}%` : `${Math.round(val)}`
      }
    },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
    tooltip: {
      y: {
        formatter: (val) => activeMetric === 'rate' ? `${val}%` : `${val} files`
      }
    },
    dataLabels: { enabled: false }
  };

  const series = [{ name: seriesName, data: seriesData }];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {displayInfo?.trendTitle || 'Trend Analysis'}
        </h3>
        <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-2xs font-semibold">
          <button 
            type="button" 
            onClick={() => setActiveMetric('rework')}
            className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
              activeMetric === 'rework' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Rework
          </button>
          <button 
            type="button" 
            onClick={() => setActiveMetric('reject')}
            className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
              activeMetric === 'reject' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Reject
          </button>
          <button 
            type="button" 
            onClick={() => setActiveMetric('rate')}
            className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
              activeMetric === 'rate' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Rate %
          </button>
        </div>
      </div>

      <div>
        <Chart options={options} series={series} type="area" height={170} />
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500 font-medium">
        <span>Timeline: <strong className="text-slate-800">{categories[0]} to {categories[categories.length - 1]}</strong></span>
        <span>Status: <strong className="text-blue-600 font-bold">Consistent Resolution</strong></span>
      </div>
    </div>
  );
}
