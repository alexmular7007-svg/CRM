package com.arjun.crm.service.impl;

import com.arjun.crm.service.EmailService;
import com.arjun.crm.service.brevo.BrevoEmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Email service implementation using Spring Mail (Gmail SMTP)
 * 
 * Replaces Resend API with standard SMTP for better reliability.
 * Uses Google App Password for authentication (not regular Gmail password).
 * 
 * Features:
 * - Retry logic with exponential backoff
 * - Comprehensive error logging
 * - HTML email templates
 * - Timeout configuration
 * 
 * @author CRM Backend Team
 * @version 2.0 (SMTP Migration)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final BrevoEmailService brevoEmailService;

    @Value("${app.mail.from:${spring.mail.username}}")
    private String fromEmail;

    @Value("${app.mail.from-name:TaskFlow}")
    private String fromName;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMMM d, yyyy 'at' h:mm a");

    /**
     * Send invitation email
     * SMTP Configuration: Gmail SMTP on port 587 with TLS
     */
    @Override
    @Retryable(
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2),
        retryFor = { MessagingException.class }
    )
    public void sendInvitationEmail(String toEmail, String workspaceName, String role, String invitationLink, LocalDateTime expiresAt, String invitedByName) throws MessagingException {
        log.info("Preparing to send invitation email to: {} for workspace: {}", toEmail, workspaceName);

        String subject = "You've been invited to join " + workspaceName;
        String expiryDate = expiresAt.format(DATE_FORMATTER);

        String htmlBody = String.format(
            """
            <html>
              <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 20px auto; padding: 0; background-color: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header Banner -->
                  <div style="background: linear-gradient(135deg, #3b82f6 0%%, #2563eb 100%%); padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">YOU ARE INVITED!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">to join %s</p>
                  </div>
                  
                  <!-- Main Content -->
                  <div style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px;">Hi,</p>
                    
                    <p style="margin: 0 0 15px 0; font-size: 16px;">
                      <strong>%s</strong> has invited you to join the workspace <strong style="color: #3b82f6; font-size: 18px;">%s</strong>
                    </p>
                    
                    <!-- Role Badge -->
                    <div style="margin: 25px 0; text-align: center;">
                      <div style="display: inline-block; padding: 12px 24px; background-color: %s; color: white; border-radius: 20px; font-weight: bold; font-size: 16px;">
                        Role: %s
                      </div>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 35px 0;">
                      <a href="%s" style="display: inline-block; padding: 15px 40px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">Accept Invitation</a>
                    </div>
                    
                    <!-- Details -->
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 30px 0;">
                      <p style="margin: 0 0 8px 0; color: #666;"><strong>Workspace:</strong> %s</p>
                      <p style="margin: 0 0 8px 0; color: #666;"><strong>Role:</strong> %s</p>
                      <p style="margin: 0; color: #666;"><strong>Invitation expires:</strong> %s</p>
                    </div>
                    
                    <!-- Footer Text -->
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="margin: 0; color: #999; font-size: 13px; text-align: center;">
                      If you didn't expect this invitation or have any questions, please contact the workspace admin or reply to this email.
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #999; font-size: 12px;">
                      TaskFlow • Workspace Collaboration Platform<br/>
                      <a href="http://localhost:3000" style="color: #3b82f6; text-decoration: none;">Visit Dashboard</a>
                    </p>
                  </div>
                  
                </div>
              </body>
            </html>
            """,
            workspaceName,
            invitedByName, workspaceName,
            role.equals("ADMIN") ? "#ef4444" : "#3b82f6",
            role,
            invitationLink,
            workspaceName, role, expiryDate
        );

        sendEmailViaSMTP(toEmail, subject, htmlBody);
    }

    @Override
    @Retryable(
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2),
        retryFor = { MessagingException.class }
    )
    public void sendMemberAddedEmail(String toEmail, String userName, String workspaceName, String role) throws MessagingException {
        log.info("Preparing to send member added email to: {} for workspace: {}", toEmail, workspaceName);

        String subject = "You've been added to " + workspaceName;

        String htmlBody = String.format(
            """
            <html>
              <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2d3748;">Welcome!</h2>
                  <p>Hi %s,</p>
                  <p>You've been added to <strong style="color: #3b82f6;">%s</strong> as a <strong>%s</strong>.</p>
                  
                  <p style="margin-top: 30px;">
                    <a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Log in to get started</a>
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                  
                  <p style="color: #666; font-size: 12px;">
                    Best regards,<br/>
                    <strong>TaskFlow Team</strong>
                  </p>
                </div>
              </body>
            </html>
            """,
            userName, workspaceName, role, getLoginUrl()
        );

        sendEmailViaSMTP(toEmail, subject, htmlBody);
    }

    @Override
    @Retryable(
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2),
        retryFor = { MessagingException.class }
    )
    public void sendInvitationExpiringEmail(String toEmail, String workspaceName, String invitationLink, LocalDateTime expiresAt) throws MessagingException {
        log.info("Preparing to send invitation expiring email to: {} for workspace: {}", toEmail, workspaceName);

        String subject = "Your " + workspaceName + " invitation is expiring soon";
        String expiryDate = expiresAt.format(DATE_FORMATTER);

        String htmlBody = String.format(
            """
            <html>
              <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #d97706;">Reminder: Invitation Expiring Soon</h2>
                  <p>Your invitation to join <strong style="color: #3b82f6;">%s</strong> is expiring on <strong>%s</strong>.</p>
                  
                  <p style="margin-top: 30px;">
                    <a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #d97706; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation Now</a>
                  </p>
                  
                  <p style="color: #666; font-size: 12px; margin-top: 20px;">
                    If you need a new invitation, please contact the workspace owner.
                  </p>
                </div>
              </body>
            </html>
            """,
            workspaceName, expiryDate, invitationLink
        );

        sendEmailViaSMTP(toEmail, subject, htmlBody);
    }

    @Override
    @Retryable(
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2),
        retryFor = { MessagingException.class }
    )
    public void sendInvitationAcceptedEmail(String toEmail, String workspaceName, String acceptedByName) throws MessagingException {
        log.info("Preparing to send invitation accepted email to: {} for workspace: {}", toEmail, workspaceName);

        String subject = acceptedByName + " joined " + workspaceName;

        String htmlBody = String.format(
            """
            <html>
              <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #10b981;">Invitation Accepted</h2>
                  <p><strong>%s</strong> has accepted your invitation to join <strong style="color: #3b82f6;">%s</strong>.</p>
                  
                  <p style="margin-top: 30px; color: #10b981;">
                    ✓ You can now start collaborating!
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                  
                  <p style="color: #666; font-size: 12px;">
                    TaskFlow Team
                  </p>
                </div>
              </body>
            </html>
            """,
            acceptedByName, workspaceName
        );

        sendEmailViaSMTP(toEmail, subject, htmlBody);
    }

    @Override
    @Retryable(
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2),
        retryFor = { MessagingException.class }
    )
    public void sendInvitationResendEmail(String toEmail, String workspaceName, String role, String invitationLink, LocalDateTime expiresAt, String resentByName) throws MessagingException {
        log.info("Preparing to send resent invitation email to: {} for workspace: {}", toEmail, workspaceName);

        String subject = "Reminder: You're invited to join " + workspaceName;
        String expiryDate = expiresAt.format(DATE_FORMATTER);

        String htmlBody = String.format(
            """
            <html>
              <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2d3748;">Your Invitation to Join %s</h2>
                  <p>%s has resent your invitation to join <strong style="color: #3b82f6;">%s</strong> as a <strong>%s</strong>.</p>
                  
                  <p style="margin-top: 30px;">
                    <a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
                  </p>
                  
                  <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    <strong>Expires:</strong> %s
                  </p>
                  
                  <p style="color: #666; font-size: 12px; margin-top: 20px;">
                    If you have any questions, please reach out to <strong>%s</strong>.
                  </p>
                </div>
              </body>
            </html>
            """,
            workspaceName, resentByName, workspaceName, role, invitationLink, expiryDate, resentByName
        );

        sendEmailViaSMTP(toEmail, subject, htmlBody);
    }

    /**
     * Send email via Brevo API (HTTP)
     * Replaces SMTP with REST API for better reliability
     * 
     * @param toEmail recipient email address
     * @param subject email subject
     * @param htmlBody email body in HTML format
     * @throws MessagingException if email sending fails
     */
    private void sendEmailViaSMTP(String toEmail, String subject, String htmlBody) throws MessagingException {
        log.info("═══════════════════════════════════════════════════════════");
        log.info("BREVO EMAIL SEND - START");
        log.info("═══════════════════════════════════════════════════════════");
        log.info("TRACE 1: Email send request via Brevo");
        log.info("  → To: {}", toEmail);
        log.info("  → Subject: {}", subject);
        log.info("  → From (configured): {}", maskEmail(fromEmail));
        
        try {
            log.info("TRACE 2: Calling BrevoEmailService.sendEmail()");
            long startTime = System.currentTimeMillis();
            
            brevoEmailService.sendEmail(toEmail, subject, htmlBody);
            
            long duration = System.currentTimeMillis() - startTime;
            log.info("TRACE 3: ✓ BREVO SUCCESS");
            log.info("  → Email sent to: {}", toEmail);
            log.info("  → Subject: {}", subject);
            log.info("  → Duration: {}ms", duration);
            log.info("═══════════════════════════════════════════════════════════");
            log.info("BREVO EMAIL SEND - SUCCESS");
            log.info("═══════════════════════════════════════════════════════════");

        } catch (Exception e) {
            log.error("TRACE X: ✗ BREVO SEND FAILED");
            log.error("  → Recipient: {}", toEmail);
            log.error("  → Exception Type: {}", e.getClass().getName());
            log.error("  → Error Message: {}", e.getMessage());
            
            if (e.getMessage() != null && e.getMessage().contains("401")) {
                log.error("  → Error Code: 401 (Invalid API Key)");
                log.error("  → Check: BREVO_API_KEY environment variable");
            }
            
            if (e.getMessage() != null && e.getMessage().contains("403")) {
                log.error("  → Error Code: 403 (Sender not verified)");
                log.error("  → Check: Email sender must be verified in Brevo dashboard");
            }
            
            log.error("  → Complete Exception Stack Trace:", e);
            log.info("═══════════════════════════════════════════════════════════");
            log.info("BREVO EMAIL SEND - FAILED");
            log.info("═══════════════════════════════════════════════════════════");
            throw new MessagingException("Failed to send email via Brevo: " + e.getMessage(), e);
        }
    }

    private String maskEmail(String email) {
        if (email == null || email.isEmpty()) {
            return "NOT_SET";
        }
        String[] parts = email.split("@");
        if (parts.length == 2) {
            String local = parts[0].length() > 3 ? parts[0].substring(0, 3) + "***" : "***";
            return local + "@" + parts[1];
        }
        return "***@***";
    }

    /**
     * Get the login URL for the app
     */
    private String getLoginUrl() {
        return "http://localhost:3000/login";
    }
}

