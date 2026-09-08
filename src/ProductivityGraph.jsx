import { useState, useEffect } from "react";
import { Activity, TrendingUp } from "lucide-react";
import "./productivity-graph.css";

export default function ProductivityGraph() {
  const [graphData, setGraphData] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    actual: [0, 0, 0, 0, 0, 0, 0],
    target: [0, 0, 0, 0, 0, 0, 0]
  });

  useEffect(() => {
    let alive = true;
    const fetchProductivity = async () => {
      try {
        const res = await fetch("/api/dashboard/productivity?period=week");
        if (!res.ok) return;
        const json = await res.json();
        if (alive && json.ok) {
          setGraphData({
            labels: json.labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            actual: json.actual || [0, 0, 0, 0, 0, 0, 0],
            target: json.target || [0, 0, 0, 0, 0, 0, 0]
          });
        }
      } catch {}
    };

    fetchProductivity();
    const interval = setInterval(fetchProductivity, 10000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const { labels: days, actual, target } = graphData;
  const total = actual.reduce((a, b) => a + b, 0);
  const targetTotal = target.reduce((a, b) => a + b, 0);
  const achievement = targetTotal > 0 ? Math.round((total / targetTotal) * 100) : 0;

  const rawMax = Math.max(...actual, ...target, 10);
  // Round up to nice number
  const maxVal = Math.ceil(rawMax / 10) * 10;
  const yTicks = [
    maxVal,
    Math.round(maxVal * 0.75),
    Math.round(maxVal * 0.5),
    Math.round(maxVal * 0.25),
    0
  ];

  const getY = (val) => {
    const clamped = Math.max(0, Number(val) || 0);
    return 195 - (clamped / Math.max(1, maxVal)) * (195 - 40);
  };

  const points = (values) =>
    values.map((value, index) => `${45 + index * 100},${getY(value).toFixed(1)}`).join(" ");

  return (
    <section className="panel productivity-graph">
      <header>
        <div>
          <span>
            <Activity />
            PRODUCTIVITY GRAPH
          </span>
          <h3>Weekly production productivity</h3>
          <p>Completed files compared with the planned daily target.</p>
        </div>
        <div className="productivity-total">
          <small>Weekly achievement</small>
          <b>{achievement}%</b>
          <em>
            <TrendingUp /> {total} files completed
          </em>
        </div>
      </header>

      <div className="productivity-chart">
        <div className="productivity-y">
          {yTicks.map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        <svg viewBox="0 0 690 220" preserveAspectRatio="none" aria-label="Weekly productivity line graph">
          <defs>
            <linearGradient id="productivityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#13a66d" stopOpacity=".28" />
              <stop offset="100%" stopColor="#13a66d" stopOpacity=".02" />
            </linearGradient>
          </defs>
          {[40, 79, 118, 156, 195].map((y) => (
            <line key={y} x1="40" x2="660" y1={y} y2={y} className="graph-grid" />
          ))}
          <polygon points={`45,195 ${points(actual)} 645,195`} fill="url(#productivityFill)" />
          <polyline points={points(target)} className="target-line" />
          <polyline points={points(actual)} className="actual-line" />
          {actual.map((value, index) => (
            <g className="graph-point" key={days[index]}>
              <circle cx={45 + index * 100} cy={getY(value)} r="5" />
              <title>
                {days[index]}: {value} completed / {target[index] || 0} target
              </title>
              <text x={45 + index * 100} y={getY(value) - 11}>
                {value}
              </text>
            </g>
          ))}
        </svg>
        <div className="productivity-x">
          {days.map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
      </div>

      <footer>
        <span>
          <i className="actual" />
          Actual productivity
        </span>
        <span>
          <i className="target" />
          Planned target
        </span>
        <small>Hover over each point to view daily values</small>
      </footer>
    </section>
  );
}
