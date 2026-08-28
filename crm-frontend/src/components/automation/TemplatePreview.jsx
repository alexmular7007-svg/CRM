import React, { useState } from 'react';
import './TemplatePreview.css';

/**
 * TemplatePreview - Phase 9: Automation Templates
 * 
 * Modal showing detailed template preview with:
 * - Template description and metadata
 * - Full workflow steps breakdown
 * - Customization prompt (automation name input)
 * - "Use Template" action button
 */
export const TemplatePreview = ({ template, workspaceId, onClose = () => {}, onUseTemplate = () => {} }) => {
  const [automationName, setAutomationName] = useState(`${template.name} - Copy`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUseTemplate = async () => {
    if (!automationName.trim()) {
      setError('Please enter a name for your automation');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/templates/${template.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          automationName: automationName.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create automation from template');
      }

      const data = await response.json();
      onUseTemplate(data.data);
    } catch (err) {
      setError(err.message || 'Error creating automation');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTriggerDescription = (triggerType) => {
    const descriptions = {
      'LEAD_CREATED': 'Triggers when a new lead is created in your workspace',
      'LEAD_MAGNET_SUBMITTED': 'Triggers when someone submits your lead magnet form',
      'EMAIL_OPENED': 'Triggers when a recipient opens an email from your campaign',
      'EMAIL_CLICKED': 'Triggers when a recipient clicks a link in your email',
      'EMAIL_DELIVERED': 'Triggers when an email is successfully delivered',
      'EMAIL_BOUNCED': 'Triggers when an email bounces'
    };
    return descriptions[triggerType] || 'Automated workflow trigger';
  };

  const getStepIcon = (stepType) => {
    const icons = {
      'SEND_EMAIL': '📧',
      'UPDATE_LEAD': '📝',
      'UPDATE_LEAD_SCORE': '⬆️',
      'WAIT_DURATION': '⏳',
      'EMAIL_OPENED_CONDITION': '👁️',
      'EMAIL_CLICKED_CONDITION': '👆',
      'LEAD_STATUS_CONDITION': '🏷️',
      'LEAD_SCORE_CONDITION': '📊'
    };
    return icons[stepType] || '⚙️';
  };

  return (
    <div className="template-preview-overlay" onClick={onClose}>
      <div className="template-preview-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="preview-header">
          <div className="header-content">
            <div className="template-icon-large">{template.icon}</div>
            <div className="header-text">
              <h2>{template.name}</h2>
              <p className="category-badge">{template.category}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="preview-body">
          
          {/* Description Section */}
          <div className="preview-section">
            <h3>About This Template</h3>
            <p className="template-description">{template.description}</p>
          </div>

          {/* Trigger Section */}
          <div className="preview-section">
            <h3>📌 Trigger</h3>
            <div className="trigger-box">
              <div className="trigger-type">{template.triggerType.replace(/_/g, ' ')}</div>
              <p className="trigger-description">{getTriggerDescription(template.triggerType)}</p>
            </div>
          </div>

          {/* Steps Section */}
          <div className="preview-section">
            <h3>⚙️ Workflow Steps</h3>
            <div className="steps-preview">
              {template.stepsCount > 0 ? (
                <div className="steps-list">
                  <p className="steps-info">This template includes {template.stepsCount} steps:</p>
                  {/* Placeholder for actual steps - they're in JSON format in the template */}
                  <div className="step-item">
                    <div className="step-number">1</div>
                    <div className="step-info">
                      <div className="step-name">Automation starts</div>
                      <div className="step-desc">Triggered by {template.triggerType.replace(/_/g, ' ')}</div>
                    </div>
                  </div>
                  {[...Array(template.stepsCount - 1)].map((_, i) => (
                    <div key={i + 2} className="step-item">
                      <div className="step-number">{i + 2}</div>
                      <div className="step-info">
                        <div className="step-name">Custom step {i + 1}</div>
                        <div className="step-desc">Configure in workflow builder</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No steps configured in this template</p>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="preview-section stats-section">
            <div className="stat-box">
              <div className="stat-value">{template.usageCount.toLocaleString()}</div>
              <div className="stat-label">Times Used</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{template.stepsCount}</div>
              <div className="stat-label">Workflow Steps</div>
            </div>
          </div>

          {/* Customization Section */}
          <div className="preview-section customization-section">
            <h3>Customize Your Automation</h3>
            <label className="input-label">Automation Name</label>
            <input
              type="text"
              className="automation-name-input"
              value={automationName}
              onChange={(e) => setAutomationName(e.target.value)}
              placeholder="Enter automation name"
            />
            <p className="input-hint">You can always change this later</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="preview-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="btn-use-template" 
            onClick={handleUseTemplate}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Use This Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
