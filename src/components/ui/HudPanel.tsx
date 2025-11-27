import React from 'react';

interface HudPanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
}

export const HudPanel: React.FC<HudPanelProps> = ({ 
  children, 
  className = '', 
  title,
  subtitle,
  onClick 
}) => {
  return (
    <div className={`hud-panel ${onClick ? 'cursor-pointer hover:border-cyber-cyan/40' : ''} ${className}`} onClick={onClick}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="hud-title">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

interface DataCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  value?: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'active' | 'warning' | 'error';
  onClick?: () => void;
}

export const DataCard: React.FC<DataCardProps> = ({ 
  children, 
  className = '', 
  title,
  value,
  unit,
  trend,
  status = 'active',
  onClick
}) => {
  const trendIcons = {
    up: '▲',
    down: '▼',
    stable: '●'
  };

  const trendColors = {
    up: 'text-emerald-green',
    down: 'text-alert-red',
    stable: 'text-gray-400'
  };

  return (
    <div className={`data-card ${onClick ? 'cursor-pointer hover:border-cyber-cyan/40' : ''} ${className}`} onClick={onClick}>
      <div className="flex items-center justify-between mb-2">
        {title && <h4 className="text-sm font-medium text-gray-300">{title}</h4>}
        <span className={`status-indicator ${status}`}></span>
      </div>
      
      {value !== undefined && (
        <div className="flex items-end justify-between">
          <div>
            <span className="digital-display text-2xl font-bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
          </div>
          
          {trend && (
            <span className={`text-sm ${trendColors[trend]}`}>
              {trendIcons[trend]}
            </span>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
};

interface StatusBadgeProps {
  status: 'active' | 'warning' | 'error' | 'processing';
  children: React.ReactNode;
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  children, 
  pulse = false 
}) => {
  const statusStyles = {
    active: 'bg-emerald-green/20 text-emerald-green border-emerald-green/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-alert-red/20 text-alert-red border-alert-red/30',
    processing: 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/30'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]} ${pulse ? 'animate-pulse' : ''}`}>
      <span className={`status-indicator ${status} ${pulse ? 'animate-ping' : ''}`}></span>
      {children}
    </span>
  );
};

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

export const GlowButton: React.FC<GlowButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false
}) => {
  const variantStyles = {
    primary: 'glow-button',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600',
    danger: 'bg-alert-red hover:bg-red-600 text-white'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} rounded-lg font-semibold transition-all duration-300 flex items-center justify-center`}
    >
      {loading && (
        <div className="loading-spinner mr-2" style={{ width: '16px', height: '16px' }}></div>
      )}
      {children}
    </button>
  );
};

interface MetricDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({ 
  label, 
  value, 
  unit, 
  change, 
  changeLabel,
  icon 
}) => {
  const changeColor = change && change > 0 ? 'text-emerald-green' : change && change < 0 ? 'text-alert-red' : 'text-gray-400';
  const changeIcon = change && change > 0 ? '▲' : change && change < 0 ? '▼' : '';

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-center space-x-3">
        {icon && <div className="text-cyber-cyan">{icon}</div>}
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <div className="flex items-baseline space-x-2">
            <span className="digital-display text-xl font-bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
        </div>
      </div>
      
      {change !== undefined && (
        <div className="text-right">
          <p className={`text-sm font-medium ${changeColor}`}>
            {changeIcon} {Math.abs(change)}%
          </p>
          {changeLabel && <p className="text-xs text-gray-500">{changeLabel}</p>}
        </div>
      )}
    </div>
  );
};
