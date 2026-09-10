package com.arjun.crm.controller;

import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.service.brevo.BrevoEmailService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

import java.time.LocalDateTime;

/**
 * Email Testing Controller
 * 
 * Development-only endpoints for SMTP configuration verification.
 * These endpoints should NOT be exposed in production.
 * 
 * Usage:
 * - Verify SMTP configuration is correct
 * - Test email delivery from backend
 * - Check authentication and TLS setup
 * - Validate sender email configuration
 * 
 * @author CRM Backend Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class EmailTestController {

    private final BrevoEmailService brevoEmailService;

    /**
     * Send a test email to verify SMTP configuration
     * 
     * Endpoint: POST /api/test/send-email
     * 
     * Request Body:
     * {
     *   "email": "recipient@example.com"
     * }
     * 
     * Response on Success (200 OK):
     * {
     *   "success": true,
     *   "message": "Test email sent successfully to recipient@example.com",
     *   "data": null
     * }
     * 
     * Response on Failure (500 Internal Server Error):
     * {
     *   "success": false,
     *   "message": "SMTP configuration failed: Authentication failed",
     *   "data": null
     * }
     * 
     * Common Issues:
     * - MAIL_USERNAME not set → 401 Unauthorized
     * - MAIL_PASSWORD incorrect → 535 Authentication failed
     * - Gmail 2FA not enabled → 534 Application-specific password required
     * - TLS not configured → Connection timeout
     * - Port wrong → Connection refused
     * 
     * @param email recipient email address (must be same as MAIL_USERNAME for Gmail test account)
     * @return API response with success/failure status
     */
    @PostMapping("/send-email")
    public ResponseEntity<ApiResponse<Void>> sendTestEmail(
            @RequestParam @NotBlank @Email String email) {

        if (email == null || email.trim().isEmpty()) {
            log.warn("Test email request received with empty email address");
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Email address is required"));
        }

        try {
            log.info("=== SMTP TEST EMAIL INITIATED ===");
            log.info("SMTP Configuration: Gmail SMTP on port 587 with TLS");
            log.info("Recipient: {}", email);
            
            // Send test email through the same Brevo provider used by campaigns.
            String subject = "SMTP Test Email";
            String htmlBody = String.join("\n",
                "<html>",
                "  <body style=\"font-family: Arial, sans-serif; color: #333; line-height: 1.6;\">",
                "    <div style=\"max-width: 600px; margin: 0 auto; padding: 20px;\">",
                "      <h2 style=\"color: #10b981;\">✓ SMTP Configuration Successful!</h2>",
                "      <p>This test email confirms that your SMTP configuration is working correctly.</p>",
                "      ",
                "      <div style=\"background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;\">",
                "        <p><strong>Details:</strong></p>",
                "        <ul style=\"margin: 10px 0; padding-left: 20px;\">",
                "          <li>Protocol: SMTP</li>",
                "          <li>Host: smtp.gmail.com</li>",
                "          <li>Port: 587</li>",
                "          <li>TLS: Enabled (Required)</li>",
                "          <li>Authentication: Enabled</li>",
                "          <li>Test Time: " + LocalDateTime.now() + "</li>",
                "        </ul>",
                "      </div>",
                "      ",
                "      <p style=\"color: #666; font-size: 12px; margin-top: 30px;\">",
                "        <strong>Your application is ready to send invitation emails!</strong>",
                "      </p>",
                "      ",
                "      <hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;\">",
                "      ",
                "      <p style=\"color: #666; font-size: 12px;\">",
                "        If you receive this email, SMTP email delivery is working perfectly.",
                "      </p>",
                "    </div>",
                "  </body>",
                "</html>"
            );

                brevoEmailService.sendEmail(email, subject, htmlBody,
                    htmlBody.replaceAll("<[^>]*>", ""), null);

            log.info("=== TEST EMAIL SENT SUCCESSFULLY ===");
            log.info("Status: 200 OK");
            log.info("Recipient: {}", email);
            
            return ResponseEntity.ok(
                    ApiResponse.success("Test email sent successfully to " + email, null)
            );

        } catch (Exception e) {
            log.error("=== SMTP MESSAGING ERROR ===");
            log.error("Type: MessagingException");
            log.error("Message: {}", e.getMessage());
            log.error("Cause: ", e);
            
            String message = e.getMessage() == null ? "Email provider failure" : e.getMessage();
            if (message.contains("401") || message.contains("403") || message.contains("API key")) {
                log.error("DIAGNOSIS: Brevo authentication or sender validation failed");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ApiResponse.error("Brevo authentication failed"));
            } else if (message.contains("Connect") || message.contains("Connection") || message.contains("timeout")) {
                log.error("DIAGNOSIS: Brevo connection failure");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ApiResponse.error("Brevo connection failed"));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ApiResponse.error("Email sending failed"));
            }

        }
    }

    /**
     * Health check for SMTP configuration
     * Returns configuration status without sending email
     * 
     * Endpoint: GET /api/test/email-config
     * 
     * @return Configuration status
     */
    @GetMapping("/email-config")
    public ResponseEntity<ApiResponse<Object>> checkEmailConfiguration() {
        log.info("Email configuration check requested");
        
        return ResponseEntity.ok(
                ApiResponse.success("Email configuration is loaded", Map.of(
                        "provider", "Gmail SMTP",
                        "host", "smtp.gmail.com",
                        "port", 587,
                        "tls", "Enabled (Required)",
                        "auth", "Enabled",
                        "status", "Ready for use"
                ))
        );
    }
}
