package com.arjun.crm.service;

import jakarta.mail.MessagingException;
import java.time.LocalDateTime;

/**
 * Service for sending emails via SMTP (Gmail)
 */
public interface EmailService {

    /**
     * Send invitation email to new user
     * @param toEmail recipient email
     * @param workspaceName name of workspace
     * @param role assigned role
     * @param invitationLink link to accept invitation
     * @param expiresAt when invitation expires
     * @param invitedByName name of user who sent the invitation
     * @throws MessagingException if email sending fails
     */
    void sendInvitationEmail(String toEmail, String workspaceName, String role, String invitationLink, LocalDateTime expiresAt, String invitedByName) throws MessagingException;

    /**
     * Send notification to existing user that they've been added to workspace
     * @param toEmail recipient email
     * @param userName name of the user
     * @param workspaceName name of workspace
     * @param role assigned role
     * @throws MessagingException if email sending fails
     */
    void sendMemberAddedEmail(String toEmail, String userName, String workspaceName, String role) throws MessagingException;

    /**
     * Send reminder that invitation is expiring soon
     * @param toEmail recipient email
     * @param workspaceName name of workspace
     * @param invitationLink link to accept
     * @param expiresAt when it expires
     * @throws MessagingException if email sending fails
     */
    void sendInvitationExpiringEmail(String toEmail, String workspaceName, String invitationLink, LocalDateTime expiresAt) throws MessagingException;

    /**
     * Send confirmation that invitation was accepted
     * @param toEmail recipient email
     * @param workspaceName name of workspace
     * @param acceptedByName who accepted the invitation
     * @throws MessagingException if email sending fails
     */
    void sendInvitationAcceptedEmail(String toEmail, String workspaceName, String acceptedByName) throws MessagingException;

    /**
     * Send resent invitation email
     * @param toEmail recipient email
     * @param workspaceName name of workspace
     * @param role assigned role
     * @param invitationLink link to accept invitation
     * @param expiresAt when invitation expires
     * @param resentByName name of user who resent the invitation
     * @throws MessagingException if email sending fails
     */
    void sendInvitationResendEmail(String toEmail, String workspaceName, String role, String invitationLink, LocalDateTime expiresAt, String resentByName) throws MessagingException;
}
