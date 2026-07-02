package com.arjun.crm.service;

import com.arjun.crm.entity.Notification;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.enums.NotificationType;
import com.arjun.crm.enums.ReferenceType;

/**
 * ENTERPRISE NOTIFICATION CENTER
 * NotificationBuilder provides a fluent API for constructing notifications
 * with proper action URLs and metadata.
 * 
 * Usage:
 * NotificationBuilder.create()
 *     .recipient(user)
 *     .workspace(workspace)
 *     .title("Task Assigned")
 *     .message("You have been assigned to task: Fix login bug")
 *     .type(NotificationType.TASK_ASSIGNED)
 *     .reference(ReferenceType.TASK, taskId)
 *     .actionUrl("/tasks/" + taskId)
 *     .build()
 */
public class NotificationBuilder {
    
    private User recipient;
    private Workspace workspace;
    private String title;
    private String message;
    private NotificationType type;
    private Long referenceId;
    private ReferenceType referenceType;
    private String actionUrl;
    
    public static NotificationBuilder create() {
        return new NotificationBuilder();
    }
    
    public NotificationBuilder recipient(User recipient) {
        this.recipient = recipient;
        return this;
    }
    
    public NotificationBuilder workspace(Workspace workspace) {
        this.workspace = workspace;
        return this;
    }
    
    public NotificationBuilder title(String title) {
        this.title = title;
        return this;
    }
    
    public NotificationBuilder message(String message) {
        this.message = message;
        return this;
    }
    
    public NotificationBuilder type(NotificationType type) {
        this.type = type;
        return this;
    }
    
    public NotificationBuilder referenceId(Long referenceId) {
        this.referenceId = referenceId;
        return this;
    }
    
    public NotificationBuilder referenceType(ReferenceType referenceType) {
        this.referenceType = referenceType;
        return this;
    }
    
    public NotificationBuilder actionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
        return this;
    }
    
    public Notification build() {
        return Notification.builder()
                .recipient(recipient)
                .workspace(workspace)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .actionUrl(actionUrl)
                .build();
    }
    
    // Getters for bulk notification support
    public User getRecipient() {
        return recipient;
    }
    
    public Workspace getWorkspace() {
        return workspace;
    }
    
    public String getTitle() {
        return title;
    }
    
    public String getMessage() {
        return message;
    }
    
    public NotificationType getType() {
        return type;
    }
    
    public Long getReferenceId() {
        return referenceId;
    }
    
    public ReferenceType getReferenceType() {
        return referenceType;
    }
    
    public String getActionUrl() {
        return actionUrl;
    }
    
    /**
     * Build notification for task assignment
     */
    public static NotificationBuilder taskAssigned(User recipient, Workspace workspace, 
                                                    Long taskId, String taskTitle) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("Task Assigned")
                .type(NotificationType.TASK_ASSIGNED)
                .referenceId(taskId)
                .referenceType(ReferenceType.TASK)
                .actionUrl("/tasks/" + taskId)
                .message("You have been assigned to task: " + taskTitle);
    }
    
    /**
     * Build notification for task update
     */
    public static NotificationBuilder taskUpdated(User recipient, Workspace workspace,
                                                   Long taskId, String taskTitle) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("Task Updated")
                .type(NotificationType.TASK_UPDATED)
                .referenceId(taskId)
                .referenceType(ReferenceType.TASK)
                .actionUrl("/tasks/" + taskId)
                .message("Task has been updated: " + taskTitle);
    }
    
    /**
     * Build notification for task comment
     */
    public static NotificationBuilder taskComment(User recipient, Workspace workspace,
                                                   Long taskId, String taskTitle,
                                                   String commenterName) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("New Comment")
                .type(NotificationType.TASK_COMMENT)
                .referenceId(taskId)
                .referenceType(ReferenceType.COMMENT)
                .actionUrl("/tasks/" + taskId)
                .message(commenterName + " commented on task: " + taskTitle);
    }
    
    /**
     * Build notification for task mention
     */
    public static NotificationBuilder taskMention(User recipient, Workspace workspace,
                                                   Long taskId, String taskTitle,
                                                   String mentionerName) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("Mentioned in Comment")
                .type(NotificationType.TASK_MENTION)
                .referenceId(taskId)
                .referenceType(ReferenceType.COMMENT)
                .actionUrl("/tasks/" + taskId)
                .message(mentionerName + " mentioned you in task: " + taskTitle);
    }
    
    /**
     * Build notification for task due date
     */
    public static NotificationBuilder taskDue(User recipient, Workspace workspace,
                                              Long taskId, String taskTitle) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("Task Due Soon")
                .type(NotificationType.TASK_DUE)
                .referenceId(taskId)
                .referenceType(ReferenceType.TASK)
                .actionUrl("/tasks/" + taskId)
                .message("Task is due soon: " + taskTitle);
    }
    
    /**
     * Build notification for overdue task
     */
    public static NotificationBuilder taskOverdue(User recipient, Workspace workspace,
                                                   Long taskId, String taskTitle) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("Task Overdue")
                .type(NotificationType.TASK_OVERDUE)
                .referenceId(taskId)
                .referenceType(ReferenceType.TASK)
                .actionUrl("/tasks/" + taskId)
                .message("Task is overdue: " + taskTitle);
    }
    
    /**
     * Build notification for chat message
     */
    public static NotificationBuilder chatMessage(User recipient, Workspace workspace,
                                                   Long chatRoomId, String roomName,
                                                   String senderName) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("New Message")
                .type(NotificationType.CHAT_MESSAGE)
                .referenceId(chatRoomId)
                .referenceType(ReferenceType.CHAT_ROOM)
                .actionUrl("/chat/" + chatRoomId)
                .message(senderName + " sent a message in " + roomName);
    }
    
    /**
     * Build notification for workspace invitation
     */
    public static NotificationBuilder workspaceInvitation(User recipient, Workspace workspace,
                                                          String inviterName) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("Workspace Invitation")
                .type(NotificationType.WORKSPACE_INVITATION)
                .referenceId(workspace.getId())
                .referenceType(ReferenceType.WORKSPACE)
                .actionUrl("/workspaces/" + workspace.getId())
                .message(inviterName + " invited you to workspace: " + workspace.getName());
    }
    
    /**
     * Build notification for workspace join
     */
    public static NotificationBuilder workspaceJoined(User recipient, Workspace workspace,
                                                       String joiningUserName) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("New Member Joined")
                .type(NotificationType.WORKSPACE_JOINED)
                .referenceId(workspace.getId())
                .referenceType(ReferenceType.WORKSPACE)
                .actionUrl("/workspaces/" + workspace.getId() + "/members")
                .message(joiningUserName + " joined the workspace");
    }
    
    /**
     * Build notification for role change
     */
    public static NotificationBuilder roleChanged(User recipient, Workspace workspace,
                                                   String newRole) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("Role Updated")
                .type(NotificationType.ROLE_CHANGED)
                .referenceId(workspace.getId())
                .referenceType(ReferenceType.WORKSPACE)
                .actionUrl("/workspaces/" + workspace.getId() + "/settings")
                .message("Your role in workspace has been changed to: " + newRole);
    }
    
    /**
     * Build notification for CRM update
     */
    public static NotificationBuilder crmUpdated(User recipient, Workspace workspace,
                                                  Long leadId, String leadName) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("Lead Updated")
                .type(NotificationType.CRM_UPDATED)
                .referenceId(leadId)
                .referenceType(ReferenceType.LEAD)
                .actionUrl("/crm/leads/" + leadId)
                .message("Lead has been updated: " + leadName);
    }
    
    /**
     * Build notification for CRM assignment
     */
    public static NotificationBuilder crmAssigned(User recipient, Workspace workspace,
                                                   Long leadId, String leadName) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("Lead Assigned")
                .type(NotificationType.CRM_ASSIGNED)
                .referenceId(leadId)
                .referenceType(ReferenceType.LEAD)
                .actionUrl("/crm/leads/" + leadId)
                .message("You have been assigned lead: " + leadName);
    }
    
    /**
     * Build notification for AI insights
     */
    public static NotificationBuilder aiInsights(User recipient, Workspace workspace,
                                                  String insightTitle, String insightMessage) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title("AI Insights")
                .type(NotificationType.AI_INSIGHTS)
                .referenceType(ReferenceType.SYSTEM)
                .actionUrl("/ai/insights")
                .message(insightMessage);
    }
    
    /**
     * Build notification for system messages
     */
    public static NotificationBuilder system(User recipient, Workspace workspace,
                                             String title, String message) {
        return create()
                .recipient(recipient)
                .workspace(workspace)
                .title(title)
                .type(NotificationType.SYSTEM)
                .referenceType(ReferenceType.SYSTEM)
                .actionUrl("/system/notifications")
                .message(message);
    }
}
