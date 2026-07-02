package com.arjun.crm.enums;

/**
 * ENTERPRISE NOTIFICATION CENTER
 * All notification types supported by the system.
 * Each type triggers specific actions and UI behaviors.
 */
public enum NotificationType {
    // Chat & Communication
    CHAT_MESSAGE,
    
    // Workspace & Members
    WORKSPACE_INVITATION,
    WORKSPACE_JOINED,
    ROLE_CHANGED,
    
    // Tasks
    TASK_ASSIGNED,
    TASK_UPDATED,
    TASK_COMMENT,
    TASK_MENTION,
    TASK_DUE,
    TASK_OVERDUE,
    
    // Projects
    PROJECT_INVITE,
    PROJECT_DUE,
    
    // CRM
    CRM_UPDATED,
    CRM_ASSIGNED,
    
    // AI Insights
    AI_INSIGHTS,
    
    // System Notifications
    SYSTEM
}
