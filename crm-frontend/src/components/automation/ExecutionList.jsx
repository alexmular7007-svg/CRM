import React, { useState, useEffect } from 'react';
import './ExecutionList.css';
import { useSelector } from 'react-redux';
import { automationService } from '../../services/automationService';

/**
 * ExecutionList - Phase 8: Automation Execution Monitoring
 * 
 * Displays a table of automation executions with:
 * - Lead email and name
 * - Execution status (badge)
 * - Started and completed times
 * - Progress bar
 * - Click to view details
 */
export const ExecutionList = ({ automationId, onExecutionSelect = () => {} }) => {
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadExecutions();
  }, [automationId, page, currentWorkspace?.id]);

  const loadExecutions = async () => {
    try {
      setLoading(true);
      if (!currentWorkspace?.id) return;
      const data = await automationService.getExecutions(currentWorkspace.id, automationId, {
        page, size: 20, sortBy: 'createdAt', sortDirection: 'desc'
      });
      setExecutions(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Error loading executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'COMPLETED': { class: 'badge-completed', label: '✓ Completed' },
      'RUNNING': { class: 'badge-running', label: '⚙️ Running' },
      'WAITING': { class: 'badge-waiting', label: '⏳ Waiting' },
      'FAILED': { class: 'badge-failed', label: '✗ Failed' },
      'PENDING': { class: 'badge-pending', label: '○ Pending' }
    };
    const badge = statusMap[status] || { class: 'badge-pending', label: status };
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <div className="execution-list loading">Loading executions...</div>;
  }

  return (
    <div className="execution-list">
      <div className="list-container">
        <table className="executions-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Started</th>
              <th>Completed</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {executions.length === 0 ? (
              <tr className="no-data">
                <td colSpan="6">No executions yet</td>
              </tr>
            ) : (
              executions.map((execution) => (
                <tr
                  key={execution.id}
                  className="execution-row"
                  onClick={() => onExecutionSelect(execution.id)}
                >
                  <td className="lead-cell">
                    <div className="lead-info">
                      <div className="lead-name">{execution.leadName || execution.leadEmail}</div>
                      <div className="lead-email">{execution.leadEmail}</div>
                    </div>
                  </td>
                  <td className="status-cell">
                    {getStatusBadge(execution.status)}
                  </td>
                  <td className="progress-cell">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${execution.progress || 0}%` }}></div>
                    </div>
                    <div className="progress-text">{execution.progress || 0}%</div>
                  </td>
                  <td className="time-cell">
                    {formatTime(execution.startedAt)}
                  </td>
                  <td className="time-cell">
                    {formatTime(execution.completedAt)}
                  </td>
                  <td className="duration-cell">
                    {execution.duration || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            ← Previous
          </button>
          <span className="page-info">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ExecutionList;
