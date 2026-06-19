/**
 * Landing Page Knowledge Service
 * Provides structured product information for the AI Copilot
 * This prevents sending database data to the AI and instead sends curated product info
 */

export const PRODUCT_KNOWLEDGE = {
  // Product Overview
  overview: {
    name: 'TaskFlow AI',
    tagline: 'Manage Projects, CRM, Team Collaboration and AI Insights from One Workspace',
    description: 'TaskFlow AI combines Project Management, CRM Pipeline, Real-Time Collaboration, Analytics and AI Intelligence in a single platform. It\'s designed to help teams collaborate seamlessly, manage projects efficiently, track sales pipelines, and make data-driven decisions.',
    vision: 'Empowering teams to work smarter with unified workspace for projects, sales, and collaboration powered by AI.',
  },

  // Core Features
  features: {
    projectManagement: {
      title: 'Project Management',
      description: 'Structure work into projects with custom workflows, milestones, and team assignments. Break down projects into actionable tasks with AI-powered prioritization.',
      keyBenefits: [
        'Kanban boards with drag-and-drop task management',
        'Custom workflows and project templates',
        'Milestone tracking and timeline visualization',
        'Team assignment and workload management',
        'AI-powered task prioritization based on urgency and complexity',
      ],
      icon: 'KanbanSquare',
    },

    crmPipeline: {
      title: 'CRM Pipeline',
      description: 'Manage leads and deals with an intuitive drag-and-drop CRM board. Track progress from prospect to closed deal with complete visibility into your sales funnel.',
      keyBenefits: [
        'Visual sales pipeline with 5+ customizable stages (Lead → Qualified → Proposal → Negotiation → Won)',
        'Lead tracking and conversion rate analysis',
        'Deal value forecasting and revenue projection',
        'Pipeline health monitoring and bottleneck identification',
        'Automated lead assignment and follow-up reminders',
      ],
      metrics: {
        examplePipeline: [
          { stage: 'Lead', count: 240, conversion: '100%' },
          { stage: 'Qualified', count: 156, conversion: '65%' },
          { stage: 'Proposal', count: 89, conversion: '57%' },
          { stage: 'Negotiation', count: 34, conversion: '38%' },
          { stage: 'Won', count: 28, conversion: '82%' },
        ],
        pipelineHealth: '82%',
        averageDealValue: '$45K',
        winRate: '28%',
      },
      icon: 'Target',
    },

    realTimeChat: {
      title: 'Real-Time Team Chat',
      description: 'Collaborate instantly with your team through direct messages, group chats, and project-specific channels. Stay connected with online status, typing indicators, and read receipts.',
      keyBenefits: [
        'Direct messaging and group conversations',
        'Project-specific chat channels',
        'Online status and availability tracking',
        'Typing indicators and read receipts',
        'Message reactions and emoji support',
        '@mention notifications for team members',
        'File sharing and rich media support',
        'AI message summarization and insights',
      ],
      icon: 'MessageSquare',
    },

    analytics: {
      title: 'Analytics Dashboard',
      description: 'Get real-time insights into team performance, project progress, and productivity metrics with beautiful charts and visualizations.',
      keyBenefits: [
        'Real-time project progress tracking',
        'Team performance metrics and KPIs',
        'Productivity analytics and burndown charts',
        'Lead and deal analytics',
        'Time tracking and resource utilization',
        'Custom reports and data export',
        'Forecasting and predictive analytics',
      ],
      icon: 'BarChart3',
    },

    aiInsights: {
      title: 'AI Intelligence',
      description: 'Receive personalized recommendations and AI-powered insights to improve workflow, boost productivity, and make smarter decisions.',
      keyBenefits: [
        'Workspace health score (0-100%)',
        'Overdue task detection and alerts',
        'Project delay prediction',
        'Team member workload analysis',
        'Risk prediction for projects and deals',
        'Smart task prioritization and assignment',
        'Productivity recommendations',
        'AI deadline prediction based on historical data',
      ],
      exampleInsight: {
        healthScore: '82%',
        status: 'Good',
        detectedIssues: [
          '3 overdue tasks',
          '1 delayed project',
          '2 overloaded members',
        ],
        recommendation: 'Reassign "Backend Integration" task to less busy team member',
      },
      icon: 'Sparkles',
    },

    security: {
      title: 'Security & Compliance',
      description: 'Enterprise-grade security with role-based access control, SSO, SAML, and comprehensive audit logs.',
      keyBenefits: [
        'Role-based access control (Owner/Admin/Member)',
        'Single Sign-On (SSO) and SAML support',
        'End-to-end encryption for sensitive data',
        'Audit logs and activity tracking',
        'GDPR and SOC 2 compliance',
        'Regular security audits',
      ],
      icon: 'Lock',
    },
  },

  // Workflow Stages
  workflow: {
    title: 'Complete TaskFlow AI Workflow',
    description: 'From workspace setup to analytics, the complete workflow keeps your team aligned and productive.',
    steps: [
      {
        number: '01',
        title: 'Create your workspace',
        description: 'Set up your team workspace in seconds and invite members with role-based access control.',
      },
      {
        number: '02',
        title: 'Organise into projects',
        description: 'Structure work into projects with custom workflows, milestones, and team assignments.',
      },
      {
        number: '03',
        title: 'Manage tasks with AI',
        description: 'Break down projects into actionable tasks. AI automatically prioritises based on urgency.',
      },
      {
        number: '04',
        title: 'Collaborate in real time',
        description: 'Communicate instantly with integrated chat, comments, @mentions, and file sharing.',
      },
      {
        number: '05',
        title: 'Track & improve',
        description: 'Monitor progress with analytics dashboards and AI-powered productivity insights.',
      },
    ],
    stats: [
      { value: '10K+', label: 'Active users' },
      { value: '50K+', label: 'Tasks completed' },
      { value: '99.9%', label: 'Uptime' },
      { value: '4.9/5', label: 'User rating' },
    ],
  },

  // Pricing Information
  pricing: {
    title: 'Simple, Transparent Pricing',
    description: 'Choose the plan that fits your team. All plans include a 14-day free trial with no credit card required.',
    plans: [
      {
        name: 'Free',
        monthlyPrice: '0',
        description: 'For individuals and small teams exploring the platform.',
        features: [
          'Up to 5 team members',
          '10 projects',
          'Basic task management',
          'Real-time chat',
          '5 GB storage',
          'Email support',
        ],
      },
      {
        name: 'Professional',
        monthlyPrice: '12',
        yearlyPrice: '9',
        description: 'For growing teams that need advanced features and AI.',
        features: [
          'Up to 50 team members',
          'Unlimited projects',
          'AI task prioritization',
          'AI deadline prediction',
          'CRM pipeline',
          'Analytics dashboard',
          '100 GB storage',
          'Priority support',
        ],
        highlighted: true,
      },
      {
        name: 'Enterprise',
        monthlyPrice: 'Custom',
        description: 'For large organisations with custom requirements and SLA.',
        features: [
          'Unlimited team members',
          'Unlimited projects',
          'All Professional features',
          'AI productivity insights',
          'Custom AI training',
          'SSO & SAML',
          'Dedicated support',
          'Custom integrations',
          'SLA guarantee',
        ],
      },
    ],
    faq: [
      {
        q: 'Can I change plans later?',
        a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.',
      },
      {
        q: 'Is there a free trial?',
        a: 'All paid plans include a 14-day free trial with no credit card required. Cancel anytime.',
      },
      {
        q: 'What happens to my data if I cancel?',
        a: 'Your data is retained for 30 days after cancellation, giving you time to export everything.',
      },
    ],
  },

  // Technology Stack
  techStack: {
    title: 'Built with Modern Technology',
    description: 'Enterprise-grade technology stack designed for scale, performance, and reliability.',
    technologies: [
      { name: 'React', category: 'Frontend', description: 'Modern UI framework for responsive interfaces' },
      { name: 'Spring Boot', category: 'Backend', description: 'Enterprise Java framework for scalable services' },
      { name: 'PostgreSQL', category: 'Database', description: 'Reliable relational database for data integrity' },
      { name: 'Redis', category: 'Cache', description: 'High-performance caching for real-time features' },
      { name: 'WebSocket', category: 'Real-time', description: 'Bi-directional communication for live collaboration' },
      { name: 'Docker', category: 'Infrastructure', description: 'Containerization for consistent deployment' },
      { name: 'JWT', category: 'Security', description: 'Secure token-based authentication' },
      { name: 'Grok AI', category: 'AI', description: 'Advanced AI model for intelligent insights' },
    ],
  },

  // Roles & Permissions
  roles: {
    Owner: {
      description: 'Full workspace control and billing management',
      permissions: [
        'Create and delete workspaces',
        'Invite and remove team members',
        'Manage billing and subscriptions',
        'Access audit logs',
        'Configure workspace settings',
        'Manage integrations',
      ],
    },
    Admin: {
      description: 'Manage projects, team members, and settings',
      permissions: [
        'Create and manage projects',
        'Create and manage CRM pipelines',
        'Invite team members',
        'Manage team member roles',
        'View analytics and reports',
        'Configure project settings',
      ],
    },
    Member: {
      description: 'Collaborate on projects and tasks',
      permissions: [
        'Create and manage tasks (assigned to them)',
        'Collaborate on projects',
        'Use real-time chat',
        'View relevant analytics',
        'Update task status',
      ],
    },
  },

  // Team Collaboration Details
  collaboration: {
    features: [
      {
        title: 'Real-time Presence',
        description: 'See who\'s online and available for collaboration',
      },
      {
        title: 'Typing Indicators',
        description: 'Know when teammates are composing messages',
      },
      {
        title: 'Read Receipts',
        description: 'Track message delivery and read status',
      },
      {
        title: 'Message Reactions',
        description: 'React with emojis to messages for quick feedback',
      },
      {
        title: '@Mentions',
        description: 'Direct notifications to specific team members',
      },
      {
        title: 'File Sharing',
        description: 'Share documents, images, and files seamlessly',
      },
    ],
  },

  // Comparison with Competitors
  comparison: {
    vs_Salesforce: {
      advantage: 'More affordable, simpler UI, AI-powered project management included',
      use_case: 'Best for growing teams needing CRM + project management in one platform',
    },
    vs_Monday: {
      advantage: 'Integrated CRM, stronger AI capabilities, unified communication',
      use_case: 'Best for teams managing both sales and projects in one place',
    },
    vs_Linear: {
      advantage: 'Includes CRM and analytics, better for non-technical teams',
      use_case: 'Best for diverse teams managing projects, sales, and collaboration',
    },
  },

  // Common Use Cases
  useCases: [
    {
      title: 'SaaS Product Teams',
      description: 'Manage product development, customer feedback, and sales pipeline in one platform',
    },
    {
      title: 'Consulting Firms',
      description: 'Track projects, client communications, and team availability',
    },
    {
      title: 'Sales Teams',
      description: 'Comprehensive CRM with task management and team collaboration',
    },
    {
      title: 'Agencies',
      description: 'Client projects, team collaboration, and progress tracking',
    },
  ],
};

/**
 * Search function to find relevant product information
 * Used to provide context-aware responses from the copilot
 */
export function searchProductKnowledge(query) {
  const lowerQuery = query.toLowerCase();
  const results = [];

  // Search through features
  Object.entries(PRODUCT_KNOWLEDGE.features).forEach(([key, feature]) => {
    if (
      feature.title.toLowerCase().includes(lowerQuery) ||
      feature.description.toLowerCase().includes(lowerQuery) ||
      key.toLowerCase().includes(lowerQuery)
    ) {
      results.push({
        type: 'feature',
        data: feature,
        key,
      });
    }
  });

  // Search through use cases
  PRODUCT_KNOWLEDGE.useCases.forEach((useCase) => {
    if (
      useCase.title.toLowerCase().includes(lowerQuery) ||
      useCase.description.toLowerCase().includes(lowerQuery)
    ) {
      results.push({
        type: 'useCase',
        data: useCase,
      });
    }
  });

  // Search through pricing
  if (lowerQuery.includes('price') || lowerQuery.includes('plan') || lowerQuery.includes('cost')) {
    results.push({
      type: 'pricing',
      data: PRODUCT_KNOWLEDGE.pricing,
    });
  }

  // Search through workflow
  if (lowerQuery.includes('workflow') || lowerQuery.includes('how') || lowerQuery.includes('process')) {
    results.push({
      type: 'workflow',
      data: PRODUCT_KNOWLEDGE.workflow,
    });
  }

  return results;
}

/**
 * Format product knowledge into a conversational response
 */
export function formatProductResponse(knowledge) {
  if (!knowledge) {
    return 'I don\'t have specific information about that topic, but I\'m happy to help! Feel free to ask about our features, pricing, or book a demo.';
  }

  if (typeof knowledge === 'string') {
    return knowledge;
  }

  if (knowledge.type === 'feature') {
    const feature = knowledge.data;
    return `${feature.title} - ${feature.description}\n\nKey Benefits:\n${feature.keyBenefits.map((b) => `• ${b}`).join('\n')}`;
  }

  if (knowledge.type === 'pricing') {
    const pricing = knowledge.data;
    return `${pricing.title}\n\n${pricing.description}\n\nOur plans:\n${pricing.plans.map((p) => `• ${p.name}: ${p.description}`).join('\n')}`;
  }

  if (knowledge.type === 'workflow') {
    const workflow = knowledge.data;
    return `${workflow.title}\n\n${workflow.steps.map((s) => `${s.number} ${s.title}: ${s.description}`).join('\n')}`;
  }

  return 'I\'d be happy to help with more information about TaskFlow AI!';
}
