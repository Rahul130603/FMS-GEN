import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { 
  Clock8, 
  Download
} from 'lucide-react';
import { 
  getTwoHourTrackingData, 
  INITIAL_EMPLOYEE_RECORDS,
  CURRENT_REPORT_DATE
} from '../data/dailyAllotmentDummyData';
import { exportTwoHourReportToExcel } from '../utils/exportUtils';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0]?.payload || {};
    const completed = payload.find(p => p.dataKey === 'completed')?.value ?? dataItem.completed ?? 0;
    const target = dataItem.target || 0;
    const qcPassed = payload.find(p => p.dataKey === 'qcPassed')?.value ?? dataItem.qcPassed ?? 0;
    const efficiency = target > 0 ? Math.round((completed / target) * 100) : 0;
    const isFuture = dataItem.isFuture;
    const isCurrent = dataItem.isCurrent;

    return (
      <div style={{
        background: '#ffffff',
        border: isFuture ? '1px solid #cbd5e1' : isCurrent ? '1px solid #3b82f6' : '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
        fontSize: '12px',
        minWidth: '240px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>
            {dataItem.timeWindow || label}
          </span>
          {isFuture && (
            <span style={{ fontSize: '9px', background: '#f1f5f9', color: '#64748b', padding: '2px 5px', borderRadius: '3px', fontWeight: '700' }}>
              ⏳ UPCOMING
            </span>
          )}
          {isCurrent && (
            <span style={{ fontSize: '9px', background: '#eff6ff', color: '#2563eb', padding: '2px 5px', borderRadius: '3px', fontWeight: '700' }}>
              ⚡ LIVE (2:18 PM)
            </span>
          )}
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
          {dataItem.session} • {dataItem.slot}
        </div>

        {isFuture ? (
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '8px', margin: '4px 0' }}>
            <div style={{ color: '#475569', fontWeight: '600', marginBottom: '3px', fontSize: '11px' }}>
              ⏳ Future Production Window (Empty)
            </div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>
              Shift time is currently <strong>~2:18 PM</strong>. This window starts at <strong>3:30 PM</strong>.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginTop: '6px', fontSize: '11px' }}>
              <span>Files Completed:</span>
              <strong>0 files</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginTop: '2px', fontSize: '11px' }}>
              <span>Planned Target:</span>
              <strong>{target} files</strong>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb', marginBottom: '4px', fontWeight: '600' }}>
              <span>Files Completed:</span>
              <strong>{completed} files</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', marginBottom: '4px', fontWeight: '600' }}>
              <span>QC Approved:</span>
              <strong>{qcPassed} files</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11px', borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '6px' }}>
              <span>Window Target:</span>
              <strong>{target} files</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7', fontSize: '11px', marginTop: '3px' }}>
              <span>Window Achievement:</span>
              <strong style={{ color: efficiency >= 100 ? '#10b981' : isCurrent ? '#2563eb' : '#f59e0b' }}>{efficiency}%</strong>
            </div>
          </>
        )}

        <div style={{ fontSize: '10px', color: '#3b82f6', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #e2e8f0', textAlign: 'center', fontWeight: '500' }}>
          👉 Click bar to inspect employee breakdown in right panel
        </div>
      </div>
    );
  }
  return null;
};

export default function HourlyProductivity({ 
  records, 
  selectedDate, 
  selectedSlot, 
  onSelectSlot, 
  onSelectEmployee 
}) {
  const employeeDataset = records && records.length > 0 ? records : INITIAL_EMPLOYEE_RECORDS;
  const isToday = !selectedDate || selectedDate === CURRENT_REPORT_DATE;

  // Real-time slot tracking data (Slot 4 empty if today at ~2:18 PM)
  const trackingData = useMemo(() => {
    return getTwoHourTrackingData(selectedDate);
  }, [selectedDate]);

  const totalCompleted = useMemo(() => {
    return trackingData.reduce((acc, d) => acc + d.completed, 0);
  }, [trackingData]);

  const totalQc = useMemo(() => {
    return trackingData.reduce((acc, d) => acc + d.qcPassed, 0);
  }, [trackingData]);

  const handleSlotClick = (slotKey) => {
    if (onSelectSlot) {
      onSelectSlot(selectedSlot === slotKey ? null : slotKey);
    }
  };

  const handleExportFullExcel = () => {
    exportTwoHourReportToExcel({
      slotData: trackingData,
      employees: employeeDataset,
      selectedDate: selectedDate || CURRENT_REPORT_DATE
    });
  };

  return (
    <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="dashboard-card-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock8 size={18} className="text-blue-600" />
            <span>2 Hours Report Tracking</span>
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
            Employee Files Management • 4 Production Time Windows (Real-Time Shift Logic)
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedSlot && (
            <button
              type="button"
              onClick={() => onSelectSlot && onSelectSlot(null)}
              style={{
                fontSize: '11px',
                color: '#ef4444',
                background: '#fee2e2',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Clear Selection
            </button>
          )}

          {/* Dedicated Download 2-Hr Excel Button */}
          <button
            type="button"
            onClick={handleExportFullExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '600',
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(5, 150, 105, 0.25)',
              transition: 'background 0.15s ease'
            }}
            title="Download Dedicated 2 Hours Report Excel (.xls)"
            onMouseEnter={e => e.currentTarget.style.background = '#047857'}
            onMouseLeave={e => e.currentTarget.style.background = '#059669'}
          >
            <Download size={13} />
            <span>Download 2-Hr Excel</span>
          </button>

          <span className="card-badge-info" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
            4 Time Slots
          </span>
        </div>
      </div>

      {/* Real-Time Shift Status Banner */}
      {isToday && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          background: '#f8fafc',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          marginBottom: '10px',
          fontSize: '11px',
          color: '#475569'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              display: 'inline-block'
            }} />
            <span>
              <strong>Real-Time Shift Tracker:</strong> Current Time <strong>~2:18 PM</strong> • Slot 3 (12.45 PM - 3.30 PM) is <strong>Active</strong>
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            Slot 4 (3.30 PM to 5.30 PM) will activate at 3:30 PM (Empty now)
          </div>
        </div>
      )}

      {/* 4 Time Slots Quick Pill Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '14px',
        padding: '8px 10px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        {trackingData.map((item) => {
          const isSelected = selectedSlot === item.slot;
          const isFuture = item.isFuture;
          const isCurrent = item.isCurrent;

          return (
            <div
              key={item.slot}
              onClick={() => handleSlotClick(item.slot)}
              style={{
                background: isSelected 
                  ? '#eff6ff' 
                  : isFuture 
                    ? '#ffffff' 
                    : isCurrent 
                      ? '#f0fdf4' 
                      : '#ffffff',
                border: isSelected 
                  ? '2px solid #2563eb' 
                  : isFuture 
                    ? '1px dashed #cbd5e1' 
                    : isCurrent 
                      ? '1px solid #86efac' 
                      : '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '6px 8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              title={isFuture 
                ? `Future production window. Starts at 3:30 PM.` 
                : `Click to view employee status for ${item.timeWindow}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: isSelected ? '#1d4ed8' : '#64748b', textTransform: 'uppercase' }}>
                  {item.slot}
                </span>

                {/* Status Badges */}
                {isSelected ? (
                  <span style={{ fontSize: '9px', background: '#2563eb', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>
                    SELECTED
                  </span>
                ) : isFuture ? (
                  <span style={{ fontSize: '9px', background: '#f1f5f9', color: '#64748b', padding: '1px 4px', borderRadius: '3px', fontWeight: '600' }}>
                    ⏳ UPCOMING
                  </span>
                ) : isCurrent ? (
                  <span style={{ fontSize: '9px', background: '#dcfce7', color: '#15803d', padding: '1px 4px', borderRadius: '3px', fontWeight: '700' }}>
                    ⚡ LIVE
                  </span>
                ) : (
                  <span style={{ fontSize: '9px', background: '#ecfdf5', color: '#059669', padding: '1px 4px', borderRadius: '3px', fontWeight: '600' }}>
                    ✓ DONE
                  </span>
                )}
              </div>

              <div style={{ fontSize: '11px', fontWeight: '600', color: isFuture ? '#64748b' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                {item.timeWindow}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '10px' }}>
                {isFuture ? (
                  <>
                    <span style={{ color: '#94a3b8', fontWeight: '600' }}>0 files</span>
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Empty (3:30 PM)</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: '#2563eb', fontWeight: '700' }}>{item.completed} files</span>
                    <span style={{ color: '#10b981', fontWeight: '500' }}>{item.qcPassed} QC</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Bar Chart */}
      <div style={{ width: '100%', height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={trackingData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barGap={6}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const clickedSlot = state.activePayload[0].payload.slot;
                handleSlotClick(clickedSlot);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="shortTime"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
            />
            <Bar
              dataKey="completed"
              name="Files Completed"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              cursor="pointer"
            >
              {trackingData.map((entry) => (
                <Cell 
                  key={`cell-comp-${entry.slot}`} 
                  fill={selectedSlot === entry.slot ? '#1d4ed8' : entry.isFuture ? '#cbd5e1' : '#2563eb'}
                  stroke={selectedSlot === entry.slot ? '#0f172a' : 'none'}
                  strokeWidth={selectedSlot === entry.slot ? 2 : 0}
                />
              ))}
            </Bar>
            <Bar
              dataKey="qcPassed"
              name="QC Approved"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              cursor="pointer"
            >
              {trackingData.map((entry) => (
                <Cell 
                  key={`cell-qc-${entry.slot}`} 
                  fill={selectedSlot === entry.slot ? '#047857' : entry.isFuture ? '#e2e8f0' : '#10b981'}
                  stroke={selectedSlot === entry.slot ? '#0f172a' : 'none'}
                  strokeWidth={selectedSlot === entry.slot ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Helper instruction banner */}
      <div 
        onClick={() => handleSlotClick('Slot 3')}
        style={{
          marginTop: '10px',
          padding: '8px 12px',
          background: '#f0fdf4',
          border: '1px dashed #86efac',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontSize: '11px',
          color: '#166534'
        }}
      >
        <span>💡 <strong>Click any 2-hour window or bar in the graph</strong> to pop up individual employee file status.</span>
        <span style={{ fontWeight: '600', textDecoration: 'underline' }}>View Live Slot 3 Breakdown ↗</span>
      </div>

      {/* Summary Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '10px',
        marginTop: '10px',
        borderTop: '1px dashed #e2e8f0',
        fontSize: '11px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span>Total Completed: <strong style={{ color: '#2563eb' }}>{totalCompleted} files</strong></span>
          <span>•</span>
          <span>QC Approved: <strong style={{ color: '#10b981' }}>{totalQc} files</strong></span>
        </div>
        <div style={{ color: '#475569', fontWeight: '500' }}>
          Shift Coverage: 8:30 AM – 5:30 PM (4 Windows • Slot 4 Upcoming)
        </div>
      </div>
    </div>
  );
}
