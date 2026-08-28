import React, { useState, useEffect } from 'react';
import './ExecutionDetail.css';
import { useSelector } from 'react-redux';
import { automationService } from '../../services/automationService';

/**
 * ExecutionDetail - Phase 8: Automation Execution Monitoring
 * 
 * Displays detailed information about a single automation execution.
 * Shows: Status timeline, all steps with checkmarks/status, error details
 */
export const ExecutionDetail = ({ automationId, executionId, onClose = () => {} }) => {
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (executionId) {
      loadExecution();
    }
  }, [automationId, executionId, currentWorkspace?.id]);

  const loadExecution = async () => {
    try {
      setLoading(true);
      if (!currentWorkspace?.id) return;
      const data = await automationService.getExecution(currentWorkspace.id, automationId, executionId);
      setExecution(data);
    } catch (error) {
      console.error('Error loading execution detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatusIcon = (status) => {
    const iconMap = {
      'COMPLETED': { icon: '✓', class: 'completed' },
      'RUNNING': { icon: '⚙️', class: 'running' },
      'WAITING': { icon: '⏳', class: 'waiting' },
      'FAILED': { icon: '✗', class: 'failed' },
      'PENDING': { icon: '○', class: 'pending' }
    };
    return iconMap[status] || { icon: '?', class: 'unknown' };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return <div className="execution-detail loading">Loading execution details...</div>;
  }

  if (!execution) {
    return <div className="execution-detail error">Execution not found</div>;
  }

  const statusColors = {
    'COMPLETED': '#10b981',
    'RUNNING': '#3b82f6',
    'WAITING': '#f59e0b',
    'FAILED': '#ef4444',
    'PENDING': '#9ca3af'
  };

  return (
    <div className="execution-detail">
      <div className="detail-header">
        <h3>Execution Details</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="detail-content">
        {/* Header Info */}
        <div className="info-section">
          <div className="info-row">
            <span className="info-label">Lead:</span>
            <span className="info-value">{execution.leadName || execution.leadEmail}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Status:</span>
            <span className="info-value" style={{ color: statusColors[execution.status] }}>
              {execution.statusLabel}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Progress:</span>
            <span className="info-value">{execution.progress}%</span>
          </div>
          <div className="info-row">
            <span className="info-label">Duration:</span>
            <span className="info-value">{execution.duration || '-'}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="timeline-section">
          <h4>Execution Timeline</h4>
          <div className="timeline">
            <div className="timeline-item">
              <span className="timeline-label">Created:</span>
              <span className="timeline-time">{formatDateTime(execution.createdAt)}</span>
            </div>
            <div className="timeline-item">
              <span className="timeline-label">Started:</span>
              <span className="timeline-time">{formatDateTime(execution.startedAt) || '-'}</span>
            </div>
            {execution.pausedAt && (
              <div className="timeline-item">
                <span className="timeline-label">Paused:</span>
                <span className="timeline-time">{formatDateTime(execution.pausedAt)}</span>
              </div>
            )}
            {execution.resumeAt && (
              <div className="timeline-item">
                <span className="timeline-label">Resume At:</span>
                <span className="timeline-time">{formatDateTime(execution.resumeAt)}</span>
              </div>
            )}
            <div className="timeline-item">
              <span className="timeline-label">Completed:</span>
              <span className="timeline-time">{formatDateTime(execution.completedAt) || '-'}</span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="steps-section">
          <h4>Workflow Steps</h4>
          <div className="steps-list">
            {execution.steps && execution.steps.map((step) => {
              const stepIcon = getStepStatusIcon(step.status);
              return (
                <div key={step.stepId} className={`step-item ${stepIcon.class}`}>
                  <div className="step-icon">{stepIcon.icon}</div>
                  <div className="step-info">
                    <div className="step-type">{step.stepTypeLabel}</div>
                    <div className="step-status">{step.statusLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Details */}
        {execution.error && (
          <div className="error-section">
            <h4>Error Details</h4>
            <div className="error-message">{execution.error}</div>
            {execution.failedStepId && (
              <div className="failed-step-info">
                Failed at step ID: {execution.failedStepId}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionDetail;
