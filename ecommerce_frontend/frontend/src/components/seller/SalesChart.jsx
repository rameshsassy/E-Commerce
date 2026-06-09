import { useMemo } from 'react';

const SalesChart = ({ data = [] }) => {
  const safeData = useMemo(() => Array.isArray(data) ? data : [], [data]);

  const chartWidth = 700;
  const chartHeight = 250;
  const padding = 40;

  const maxRevenue = useMemo(
    () => Math.max(...safeData.map((d) => d.revenue), 1000),
    [safeData]
  );

  const points = useMemo(() => {
    if (safeData.length < 2) {
      return safeData.map((d) => ({
        x: padding,
        y: chartHeight - padding,
        revenue: d?.revenue ?? 0,
        date: d?.date,
      }));
    }

    return safeData.map((d, i) => {
      const x = (i / (safeData.length - 1)) * (chartWidth - padding * 2) + padding;
      const y =
        chartHeight -
        ((d.revenue || 0) / maxRevenue) * (chartHeight - padding * 2) -
        padding;
      return { x, y, revenue: d.revenue || 0, date: d.date };
    });
  }, [safeData, maxRevenue, chartWidth, chartHeight, padding]);

  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((path, p, i) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      // Use bezier curves for smoothness
      const prev = points[i - 1];
      const cp1x = prev.x + (p.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (p.x - prev.x) / 2;
      const cp2y = p.y;
      return `${path} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`;
    }, '');
  }, [points]);

  const areaPath = useMemo(() => {
    if (linePath === '') return '';
    return `${linePath} L ${points[points.length - 1].x},${chartHeight - padding} L ${points[0].x},${chartHeight - padding} Z`;
  }, [linePath, points, chartHeight, padding]);

  // If no data, show placeholder
  if (safeData.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-[400px] flex flex-col justify-center items-center">
        <h3 className="text-xl font-bold mb-6 self-start">Revenue Over Time</h3>
        <p className="text-text-muted">No sales data available for the selected period.</p>
      </div>
    );
  }

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl h-[400px] flex flex-col">
      <h3 className="text-xl font-bold mb-6">Revenue Over Time</h3>
      
      <div className="flex-1 w-full relative group">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
            <line 
              key={i}
              x1={padding} 
              y1={padding + v * (chartHeight - padding * 2)} 
              x2={chartWidth - padding} 
              y2={padding + v * (chartHeight - padding * 2)} 
              stroke="var(--glass-border)" 
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Area */}
          <path d={areaPath} fill="url(#chartGradient)" />

          {/* Line */}
          <path 
            d={linePath} 
            fill="none" 
            stroke="var(--color-primary)" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="drop-shadow-glow"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i} className="cursor-pointer group/point">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="6" 
                fill="var(--color-primary)" 
                className="opacity-0 group-hover/point:opacity-100 transition-opacity"
              />
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="12" 
                fill="var(--color-primary)" 
                className="opacity-0 group-hover/point:opacity-20 transition-opacity"
              />
              
              {/* Tooltip on hover (simplified) */}
              <title>{`${formatXAxis(p.date)}: Rs. ${p.revenue.toFixed(2)}`}</title>
            </g>
          ))}

          {/* X Axis labels */}
          {points.filter((_, i) => i % Math.ceil(points.length / 5) === 0).map((p, i) => (
            <text 
              key={i}
              x={p.x} 
              y={chartHeight - 10} 
              fill="var(--color-text-muted)" 
              fontSize="10" 
              textAnchor="middle"
            >
              {formatXAxis(p.date)}
            </text>
          ))}

          {/* Y Axis labels */}
          {[0, 0.5, 1].map((v, i) => (
            <text 
              key={i}
              x={padding - 5} 
              y={chartHeight - padding - v * (chartHeight - padding * 2)} 
              fill="var(--color-text-muted)" 
              fontSize="10" 
              textAnchor="end"
              alignmentBaseline="middle"
            >
              ₹{Math.round(v * maxRevenue)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default SalesChart;
