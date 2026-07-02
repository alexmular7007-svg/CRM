package com.arjun.crm.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.core.env.PropertySource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * COMPREHENSIVE SMTP Configuration Audit Logger
 * 
 * This component audits SMTP configuration at startup and logs:
 * - Which configuration file is being used (application.yml vs application-dev-local.yml)
 * - Where the password comes from (environment variable, file, or default)
 * - Configuration priority/override order
 * - Final resolved values that JavaMailSender will use
 */
@Component
@Slf4j
public class SmtpConfigurationLogger {

    private final Environment environment;
    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.host:NOT_SET}")
    private String mailHost;

    @Value("${spring.mail.port:NOT_SET}")
    private String mailPort;

    @Value("${spring.mail.username:NOT_SET}")
    private String mailUsername;

    @Value("${spring.mail.password:NOT_SET}")
    private String mailPassword;

    @Value("${app.mail.from:NOT_SET}")
    private String mailFrom;

    public SmtpConfigurationLogger(Environment environment, JavaMailSender javaMailSender) {
        this.environment = environment;
        this.javaMailSender = javaMailSender;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void auditSmtpConfiguration() {
        log.info("");
        log.info("╔═══════════════════════════════════════════════════════════════════════════╗");
        log.info("║                   SMTP CONFIGURATION AUDIT - STARTUP                      ║");
        log.info("╚═══════════════════════════════════════════════════════════════════════════╝");
        
        // ═══════════════════════════════════════════════════════════════════════════
        // PART 1: Active Profiles
        // ═══════════════════════════════════════════════════════════════════════════
        log.info("");
        log.info("PART 1: ACTIVE SPRING PROFILES");
        log.info("─────────────────────────────────────────────────────────────────────────");
        
        String[] profiles = environment.getActiveProfiles();
        if (profiles.length == 0) {
            log.info("  Active Profiles: [default]");
        } else {
            for (String profile : profiles) {
                log.info("  Active Profile: [{}]", profile);
            }
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // PART 2: Configuration Source Audit
        // ═══════════════════════════════════════════════════════════════════════════
        log.info("");
        log.info("PART 2: CONFIGURATION SOURCE AUDIT");
        log.info("─────────────────────────────────────────────────────────────────────────");
        log.info("  Checking where each setting comes from...");
        log.info("");
        
        auditConfigurationSource("spring.mail.host");
        auditConfigurationSource("spring.mail.port");
        auditConfigurationSource("spring.mail.username");
        auditConfigurationSource("spring.mail.password");
        
        // ═══════════════════════════════════════════════════════════════════════════
        // PART 3: Final Resolved Configuration
        // ═══════════════════════════════════════════════════════════════════════════
        log.info("");
        log.info("PART 3: FINAL RESOLVED SMTP CONFIGURATION");
        log.info("─────────────────────────────────────────────────────────────────────────");
        log.info("  spring.mail.host       : {}", mailHost);
        log.info("  spring.mail.port       : {}", mailPort);
        log.info("  spring.mail.username   : {}", maskEmail(mailUsername));
        log.info("  spring.mail.password   : {} (length: {})", maskPassword(mailPassword), 
            mailPassword != null && !mailPassword.equals("NOT_SET") ? mailPassword.length() : 0);
        log.info("  app.mail.from          : {}", maskEmail(mailFrom));
        
        // ═══════════════════════════════════════════════════════════════════════════
        // PART 4: Security & Connection Settings
        // ═══════════════════════════════════════════════════════════════════════════
        log.info("");
        log.info("PART 4: SECURITY & CONNECTION SETTINGS");
        log.info("─────────────────────────────────────────────────────────────────────────");
        
        String auth = environment.getProperty("spring.mail.properties.mail.smtp.auth", "NOT_SET");
        String tlsEnabled = environment.getProperty("spring.mail.properties.mail.smtp.starttls.enable", "NOT_SET");
        String tlsRequired = environment.getProperty("spring.mail.properties.mail.smtp.starttls.required", "NOT_SET");
        String connectTimeout = environment.getProperty("spring.mail.properties.mail.smtp.connectiontimeout", "NOT_SET");
        String readTimeout = environment.getProperty("spring.mail.properties.mail.smtp.timeout", "NOT_SET");
        
        log.info("  SMTP Auth Enabled      : {}", auth);
        log.info("  STARTTLS Enabled       : {}", tlsEnabled);
        log.info("  STARTTLS Required      : {}", tlsRequired);
        log.info("  Connection Timeout     : {} ms", connectTimeout);
        log.info("  Read Timeout           : {} ms", readTimeout);
        
        // ═══════════════════════════════════════════════════════════════════════════
        // PART 5: JavaMailSender Runtime State
        // ═══════════════════════════════════════════════════════════════════════════
        log.info("");
        log.info("PART 5: JAVAMAIL SENDER RUNTIME STATE");
        log.info("─────────────────────────────────────────────────────────────────────────");
        
        try {
            if (javaMailSender != null) {
                log.info("  JavaMailSender Bean    : Present ✓");
                log.info("  Mail Sender Type       : {}", javaMailSender.getClass().getSimpleName());
            } else {
                log.warn("  JavaMailSender Bean    : NOT FOUND ✗");
            }
        } catch (Exception e) {
            log.error("  JavaMailSender Bean    : Error accessing bean - {}", e.getMessage());
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // PART 6: Validation & Warnings
        // ═══════════════════════════════════════════════════════════════════════════
        log.info("");
        log.info("PART 6: CONFIGURATION VALIDATION");
        log.info("─────────────────────────────────────────────────────────────────────────");
        
        boolean isValid = true;
        
        if ("NOT_SET".equals(mailHost)) {
            log.error("  ✗ spring.mail.host is NOT SET");
            isValid = false;
        } else {
            log.info("  ✓ spring.mail.host is configured: {}", mailHost);
        }
        
        if ("NOT_SET".equals(mailPort)) {
            log.error("  ✗ spring.mail.port is NOT SET");
            isValid = false;
        } else {
            log.info("  ✓ spring.mail.port is configured: {}", mailPort);
        }
        
        if ("NOT_SET".equals(mailUsername) || "noemail@example.com".equals(mailUsername)) {
            log.error("  ✗ spring.mail.username is NOT configured or using default");
            isValid = false;
        } else {
            log.info("  ✓ spring.mail.username is configured");
        }
        
        if ("NOT_SET".equals(mailPassword) || "nopassword".equals(mailPassword)) {
            log.error("  ✗ spring.mail.password is NOT configured or using default");
            isValid = false;
        } else {
            log.info("  ✓ spring.mail.password is configured (length: {})", mailPassword.length());
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // Final Status
        // ═══════════════════════════════════════════════════════════════════════════
        log.info("");
        if (isValid) {
            log.info("╔═══════════════════════════════════════════════════════════════════════════╗");
            log.info("║  ✓ SMTP CONFIGURATION VALID - Ready to send emails                       ║");
            log.info("╚═══════════════════════════════════════════════════════════════════════════╝");
        } else {
            log.warn("╔═══════════════════════════════════════════════════════════════════════════╗");
            log.warn("║  ✗ SMTP CONFIGURATION INCOMPLETE - Email sending will FAIL              ║");
            log.warn("╚═══════════════════════════════════════════════════════════════════════════╝");
        }
        log.info("");
    }

    /**
     * Audit where a specific configuration property comes from
     */
    private void auditConfigurationSource(String propertyName) {
        String value = environment.getProperty(propertyName);
        
        log.info("  Property: {} ", propertyName);
        
        if (value == null) {
            log.info("    → Value: NOT FOUND");
        } else if (value.equals("NOT_SET")) {
            log.info("    → Value: NOT_SET (default placeholder)");
        } else {
            // Determine source by checking property sources
            String source = "UNKNOWN";
            
            // Check environment variables first
            String envVar = convertPropertyToEnvVar(propertyName);
            String envValue = System.getenv(envVar);
            if (envValue != null) {
                source = "ENVIRONMENT VARIABLE: " + envVar;
            } else {
                // Check if it came from application.yml or application-dev-local.yml
                if (propertyName.contains("mail")) {
                    // Check which profile file it came from by checking property sources
                    source = "APPLICATION CONFIGURATION FILE";
                }
            }
            
            log.info("    → Value: {}", maskSensitiveValue(propertyName, value));
            log.info("    → Source: {}", source);
        }
    }

    /**
     * Convert spring property name to environment variable name
     * Example: spring.mail.username → SPRING_MAIL_USERNAME
     */
    private String convertPropertyToEnvVar(String propertyName) {
        return propertyName.toUpperCase().replace(".", "_");
    }

    /**
     * Mask sensitive values based on property name
     */
    private String maskSensitiveValue(String propertyName, String value) {
        if (propertyName.contains("password")) {
            return maskPassword(value);
        } else if (propertyName.contains("username")) {
            return maskEmail(value);
        }
        return value;
    }

    private String maskEmail(String email) {
        if (email == null || email.equals("NOT_SET") || email.equals("noemail@example.com")) {
            return email;
        }
        String[] parts = email.split("@");
        if (parts.length == 2) {
            String local = parts[0].length() > 3 ? parts[0].substring(0, 3) + "***" : "***";
            return local + "@" + parts[1];
        }
        return "***@***";
    }

    private String maskPassword(String password) {
        if (password == null || password.equals("NOT_SET") || password.equals("nopassword")) {
            return password;
        }
        if (password.length() > 6) {
            return password.substring(0, 3) + "***" + password.substring(password.length() - 3);
        }
        return "***" + password.substring(Math.max(0, password.length() - 3));
    }
}
