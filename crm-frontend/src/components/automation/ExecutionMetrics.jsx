import React from 'react';
import './ExecutionMetrics.css';

/**
 * ExecutionMetrics - Phase 8: Automation Execution Monitoring
 * 
 * Displays high-level metrics for automation executions.
 * Shows: Total, Running, Waiting, Failed counts and success rate
 */
export const ExecutionMetrics = ({ metrics = {} }) => {
  const {
    totalExecutions = 0,
    completedExecutions = 0,
    failedExecutions = 0,
    waitingExecutions = 0,
    runningExecutions = 0,
    successRate = 0
  } = metrics;

  const getSuccessColor = (rate) => {
    if (rate >= 90) return '#10b981';  // green
    if (rate >= 70) return '#f59e0b';  // amber
    return '#ef4444';  // red
  };

  return (
    <div className="execution-metrics">
      <div className="metrics-grid">
        
        <div className="metric-card total">
          <div className="metric-label">Total</div>
          <div className="metric-value">{totalExecutions.toLocaleString()}</div>
        </div>

        <div className="metric-card running">
          <div className="metric-label">Running</div>
          <div className="metric-value">{runningExecutions}</div>
          <div className="metric-icon">⚙️</div>
        </div>

        <div className="metric-card waiting">
          <div className="metric-label">Waiting</div>
          <div className="metric-value">{waitingExecutions}</div>
          <div className="metric-icon">⏳</div>
        </div>

        <div className="metric-card failed">
          <div className="metric-label">Failed</div>
          <div className="metric-value">{failedExecutions}</div>
          <div className="metric-icon">❌</div>
        </div>

        <div className="metric-card success-rate">
          <div className="metric-label">Success Rate</div>
          <div className="metric-value" style={{ color: getSuccessColor(successRate) }}>
            {successRate.toFixed(1)}%
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExecutionMetrics;
