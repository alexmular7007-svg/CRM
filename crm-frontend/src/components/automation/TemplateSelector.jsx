import React from 'react';
import './TemplateSelector.css';

/**
 * TemplateSelector - Phase 9: Automation Templates
 * 
 * Presents two choices to user:
 * 1. Start with Blank Workflow
 * 2. Choose from Template Gallery
 */
export const TemplateSelector = ({ onSelectBlank = () => {}, onSelectTemplates = () => {} }) => {
  return (
    <div className="template-selector">
      <div className="selector-container">
        <h2 className="selector-title">How would you like to create your automation?</h2>
        <p className="selector-subtitle">Start from scratch or use a pre-built template</p>

        <div className="selector-options">
          
          {/* Option 1: Blank Workflow */}
          <div className="selector-card blank-card" onClick={onSelectBlank}>
            <div className="card-icon">✏️</div>
            <h3 className="card-title">Blank Workflow</h3>
            <p className="card-description">
              Start from scratch and build your own custom automation workflow
            </p>
            <div className="card-features">
              <div className="feature">• Full customization</div>
              <div className="feature">• All step types available</div>
              <div className="feature">• Create complex workflows</div>
            </div>
            <button className="card-button">Start Blank</button>
          </div>

          {/* Option 2: Template Gallery */}
          <div className="selector-card template-card" onClick={onSelectTemplates}>
            <div className="card-icon">🎨</div>
            <h3 className="card-title">Use a Template</h3>
            <p className="card-description">
              Choose from proven templates designed for common automation scenarios
            </p>
            <div className="card-features">
              <div className="feature">• Quick setup (2 minutes)</div>
              <div className="feature">• Pre-configured steps</div>
              <div className="feature">• Fully customizable</div>
            </div>
            <button className="card-button">Browse Templates</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
