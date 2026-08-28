import React, { useState, useEffect } from 'react';
import './EmailGenerationForm.css';

/**
 * EmailGenerationForm - Phase 10: AI Email Generation
 *
 * Form for collecting user inputs for AI email generation.
 * 
 * Form Fields:
 * - Purpose (what is the email about)
 * - Target Audience (who should receive it)
 * - Product/Service (what are we promoting)
 * - Tone (professional, friendly, urgent, etc.)
 * - Offer (optional special offer)
 * - CTA Text (button text)
 * - CTA URL (button link)
 * - Company Name (optional signature)
 */
export const EmailGenerationForm = ({ onGenerate = () => {}, onCancel = () => {} }) => {
  const [form, setForm] = useState({
    purpose: '',
    targetAudience: '',
    productService: '',
    tone: 'Professional',
    offer: '',
    ctaText: 'Get Started',
    ctaUrl: '',
    companyName: '',
  });

  const [tones, setTones] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load available tones from API
    loadTones();
  }, []);

  const loadTones = async () => {
    try {
      const response = await fetch('/api/emails/tones');
      const data = await response.json();
      setTones(data.data || []);
    } catch (error) {
      console.error('Error loading tones:', error);
      setTones(['Professional', 'Friendly', 'Urgent', 'Casual', 'Formal', 'Persuasive', 'Humorous']);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    if (!form.targetAudience.trim()) {
      newErrors.targetAudience = 'Target audience is required';
    }
    if (!form.productService.trim()) {
      newErrors.productService = 'Product/Service is required';
    }
    if (!form.tone) {
      newErrors.tone = 'Tone is required';
    }
    if (!form.ctaText.trim()) {
      newErrors.ctaText = 'CTA text is required';
    }
    if (!form.ctaUrl.trim()) {
      newErrors.ctaUrl = 'CTA URL is required';
    } else if (!/^https?:\/\//.test(form.ctaUrl)) {
      newErrors.ctaUrl = 'CTA URL must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onGenerate(form);
  };

  if (loading) {
    return <div className="email-generation-form loading">Loading form...</div>;
  }

  return (
    <form className="email-generation-form" onSubmit={handleSubmit}>
      <div className="form-container">
        <h3 className="form-title">🤖 Generate Email with AI</h3>
        <p className="form-subtitle">Tell us about your email, and AI will generate professional content</p>

        {/* Purpose */}
        <div className="form-group">
          <label htmlFor="purpose">📌 Purpose *</label>
          <input
            id="purpose"
            type="text"
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            placeholder="e.g., Product launch announcement"
            className={`form-input ${errors.purpose ? 'error' : ''}`}
          />
          {errors.purpose && <span className="error-text">{errors.purpose}</span>}
        </div>

        {/* Target Audience */}
        <div className="form-group">
          <label htmlFor="targetAudience">👥 Target Audience *</label>
          <input
            id="targetAudience"
            type="text"
            name="targetAudience"
            value={form.targetAudience}
            onChange={handleChange}
            placeholder="e.g., New leads, High-value customers"
            className={`form-input ${errors.targetAudience ? 'error' : ''}`}
          />
          {errors.targetAudience && <span className="error-text">{errors.targetAudience}</span>}
        </div>

        {/* Product/Service */}
        <div className="form-group">
          <label htmlFor="productService">🎯 Product/Service *</label>
          <input
            id="productService"
            type="text"
            name="productService"
            value={form.productService}
            onChange={handleChange}
            placeholder="e.g., Cloud storage service"
            className={`form-input ${errors.productService ? 'error' : ''}`}
          />
          {errors.productService && <span className="error-text">{errors.productService}</span>}
        </div>

        {/* Tone */}
        <div className="form-group">
          <label htmlFor="tone">💬 Tone *</label>
          <select
            id="tone"
            name="tone"
            value={form.tone}
            onChange={handleChange}
            className={`form-select ${errors.tone ? 'error' : ''}`}
          >
            {tones.map(tone => (
              <option key={tone} value={tone}>{tone}</option>
            ))}
          </select>
          {errors.tone && <span className="error-text">{errors.tone}</span>}
        </div>

        {/* Offer (Optional) */}
        <div className="form-group">
          <label htmlFor="offer">🎁 Offer (Optional)</label>
          <input
            id="offer"
            type="text"
            name="offer"
            value={form.offer}
            onChange={handleChange}
            placeholder="e.g., 20% discount, Free trial, Limited time offer"
            className="form-input"
          />
        </div>

        {/* CTA Text */}
        <div className="form-group">
          <label htmlFor="ctaText">CTA Button Text *</label>
          <input
            id="ctaText"
            type="text"
            name="ctaText"
            value={form.ctaText}
            onChange={handleChange}
            placeholder="e.g., Get Started, Learn More"
            className={`form-input ${errors.ctaText ? 'error' : ''}`}
          />
          {errors.ctaText && <span className="error-text">{errors.ctaText}</span>}
        </div>

        {/* CTA URL */}
        <div className="form-group">
          <label htmlFor="ctaUrl">CTA Button URL *</label>
          <input
            id="ctaUrl"
            type="url"
            name="ctaUrl"
            value={form.ctaUrl}
            onChange={handleChange}
            placeholder="https://example.com/signup"
            className={`form-input ${errors.ctaUrl ? 'error' : ''}`}
          />
          {errors.ctaUrl && <span className="error-text">{errors.ctaUrl}</span>}
        </div>

        {/* Company Name (Optional) */}
        <div className="form-group">
          <label htmlFor="companyName">Company Name (Optional)</label>
          <input
            id="companyName"
            type="text"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            placeholder="e.g., TechCorp"
            className="form-input"
          />
        </div>

        {/* Buttons */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-generate"
          >
            ✨ Generate Email
          </button>
        </div>

        <p className="form-note">
          * Required fields. AI will generate a professional email based on your inputs.
        </p>
      </div>
    </form>
  );
};

export default EmailGenerationForm;
