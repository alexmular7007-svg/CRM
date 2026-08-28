import React, { useState, useEffect } from 'react';
import './TemplateGallery.css';

/**
 * TemplateGallery - Phase 9: Automation Templates
 * 
 * Professional SaaS-style template gallery with:
 * - Responsive grid (desktop 3 cols, tablet 2 cols, mobile 1 col)
 * - Category filtering
 * - Template cards with preview
 * - Popular templates highlighted
 */
export const TemplateGallery = ({ onTemplateSelect = () => {} }) => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory, page]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/templates/categories');
      const data = await response.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      let url = `/api/templates?page=${page}&size=12&sortBy=usageCount&sortDirection=DESC`;
      
      if (selectedCategory !== 'all') {
        url = `/api/templates/by-category/${selectedCategory}?page=${page}&size=12`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setTemplates(data.data?.content || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTriggerLabel = (triggerType) => {
    const labels = {
      'LEAD_CREATED': 'When lead created',
      'LEAD_MAGNET_SUBMITTED': 'When lead magnet submitted',
      'EMAIL_OPENED': 'When email opened',
      'EMAIL_CLICKED': 'When email clicked',
      'EMAIL_DELIVERED': 'When email delivered',
      'EMAIL_BOUNCED': 'When email bounced'
    };
    return labels[triggerType] || triggerType;
  };

  return (
    <div className="template-gallery">
      <div className="gallery-header">
        <div className="header-content">
          <h2>Automation Templates</h2>
          <p>Choose from professionally designed templates to jumpstart your workflows</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <div className="filter-container">
          <button
            className={`filter-button ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('all');
              setPage(0);
            }}
          >
            All Templates
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`filter-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(category);
                setPage(0);
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="gallery-loading">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="gallery-empty">No templates available</div>
      ) : (
        <div className="templates-grid">
          {templates.map(template => (
            <div key={template.id} className="template-card" onClick={() => onTemplateSelect(template)}>
              {/* Popular Badge */}
              {template.usageCount > 50 && (
                <div className="popular-badge">⭐ Popular</div>
              )}

              {/* Icon */}
              <div className="template-icon">{template.icon}</div>

              {/* Content */}
              <div className="template-content">
                <h3 className="template-name">{template.name}</h3>
                <p className="template-description">{template.description}</p>

                {/* Metadata */}
                <div className="template-meta">
                  <span className="trigger-type">{getTriggerLabel(template.triggerType)}</span>
                  <span className="steps-count">{template.stepsCount} steps</span>
                </div>

                {/* Stats */}
                <div className="template-stats">
                  <div className="stat">
                    <span className="stat-label">Used</span>
                    <span className="stat-value">{template.usageCount.toLocaleString()}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Steps</span>
                    <span className="stat-value">{template.stepsCount}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button className="use-template-btn">Use This Template</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
