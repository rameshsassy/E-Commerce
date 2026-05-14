import React from 'react';

const AnalyticsCard = ({ title, value, icon, trend, prefix = "" }) => {
  const isPositive = trend >= 0;

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 text-primary/5 transition-transform duration-500 group-hover:scale-110">
        {React.cloneElement(icon, { size: 120 })}
      </div>
      
      <div className="flex justify-between items-start relative z-10">
        <p className="text-text-muted font-medium text-sm">{title}</p>
        <div className="p-2 bg-primary/10 text-primary rounded-xl shadow-glow">
          {React.cloneElement(icon, { size: 20 })}
        </div>
      </div>
      
      <h3 className="text-3xl font-bold mt-2 relative z-10">{prefix}{value}</h3>
      
      {trend !== undefined && (
        <div className="flex items-center gap-2 mt-1 relative z-10">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
            {isPositive ? '+' : ''}{trend}%
          </span>
          <span className="text-xs text-text-muted">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCard;
