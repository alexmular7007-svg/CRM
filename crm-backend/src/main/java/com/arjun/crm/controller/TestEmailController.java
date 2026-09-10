package com.arjun.crm.controller;

import com.arjun.crm.service.brevo.BrevoEmailService;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * SMTP Diagnostic Test Controller
 * Simple endpoint to test SMTP without any business logic
 */
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class TestEmailController {

    private final BrevoEmailService brevoEmailService;

    @Value("${spring.mail.username:NOT_SET}")
    private String fromEmail;

    @Value("${spring.mail.host:NOT_SET}")
    private String smtpHost;

    @Value("${spring.mail.port:0}")
    private int smtpPort;

    /**
     * POST /api/test/email
     * Send a test email directly through JavaMailSender
     * No database, no tokens, no workspace logic
     */
    @PostMapping("/email")
    public ResponseEntity<Map<String, Object>> sendTestEmail(
            @RequestParam @Email(message = "Valid email address is required") String to) {
        Map<String, Object> response = new HashMap<>();
        
        log.info("═══════════════════════════════════════════════════════════");
        log.info("SMTP TEST EMAIL - START");
        log.info("═══════════════════════════════════════════════════════════");
        log.info("Step 1: Test email request received");
        log.info("  → Recipient: {}", to);
        log.info("  → From: {}", maskEmail(fromEmail));
        log.info("  → SMTP Host: {}", smtpHost);
        log.info("  → SMTP Port: {}", smtpPort);
        
        response.put("recipient", to);
        response.put("from", maskEmail(fromEmail));
        response.put("smtpHost", smtpHost);
        response.put("smtpPort", smtpPort);

        if ("NOT_SET".equals(fromEmail) || fromEmail == null || fromEmail.isEmpty()) {
            log.error("Step 2: SMTP sender email NOT configured!");
            response.put("success", false);
            response.put("error", "MAIL_USERNAME environment variable is not set");
            log.info("═══════════════════════════════════════════════════════════");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            String htmlBody = """
                <html>
                  <body style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2d3748;">SMTP Test Successful!</h2>
                    <p>This is a test email from TaskFlow CRM Backend.</p>
                    <p>If you received this email, your SMTP configuration is working correctly.</p>
                    <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                      Sent from: %s<br/>
                      SMTP Host: %s:%d
                    </p>
                  </body>
                </html>
                """.formatted(fromEmail, smtpHost, smtpPort);
            
            String plainTextBody = "This is a test email from TaskFlow CRM Backend. If you received this email, Brevo delivery is working correctly.";
            log.info("Step 2: Calling BrevoEmailService.sendEmail()");
            long startTime = System.currentTimeMillis();
            String providerResponse = brevoEmailService.sendEmail(to, "Brevo Test Email from TaskFlow", htmlBody, plainTextBody, null);
            
            long endTime = System.currentTimeMillis();
            log.info("Step 3: ✓ EMAIL SENT SUCCESSFULLY (took {} ms)", (endTime - startTime));
            log.info("═══════════════════════════════════════════════════════════");
            log.info("SMTP TEST EMAIL - SUCCESS");
            log.info("═══════════════════════════════════════════════════════════");

            response.put("success", true);
            response.put("message", "Test email sent successfully");
            response.put("providerResponse", providerResponse);
            response.put("durationMs", (endTime - startTime));
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Step X: ✗ SMTP FAILURE - MessagingException caught");
            log.error("  → Exception Type: {}", e.getClass().getName());
            log.error("  → Error Message: {}", e.getMessage());
            
            if (e.getCause() != null) {
                log.error("  → Root Cause: {}", e.getCause().getClass().getName());
                log.error("  → Root Cause Message: {}", e.getCause().getMessage());
            }
            
            log.error("  → Full Stack Trace:", e);
            log.info("═══════════════════════════════════════════════════════════");
            log.info("SMTP TEST EMAIL - FAILED");
            log.info("═══════════════════════════════════════════════════════════");

            response.put("success", false);
            response.put("error", "Brevo test email failed");
            response.put("errorType", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);

        }
    }

    private String maskEmail(String email) {
        if (email == null || email.equals("NOT_SET")) {
            return email;
        }
        String[] parts = email.split("@");
        if (parts.length == 2) {
            String local = parts[0].length() > 3 ? parts[0].substring(0, 3) + "***" : "***";
            return local + "@" + parts[1];
        }
        return "***@***";
    }
}
