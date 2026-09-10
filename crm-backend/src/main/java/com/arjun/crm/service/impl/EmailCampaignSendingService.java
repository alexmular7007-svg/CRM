package com.arjun.crm.service.impl;

import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailCampaignRecipient;
import com.arjun.crm.entity.EmailTemplate;
import com.arjun.crm.repository.EmailCampaignRecipientRepository;
import com.arjun.crm.repository.EmailCampaignRepository;
import com.arjun.crm.service.brevo.BrevoEmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * EmailCampaignSendingService - FEATURE #3
 * 
 * Handles asynchronous email campaign sending.
 * 
 * Responsibility:
 * 1. Load campaign and template
 * 2. Load recipients
 * 3. For each recipient: render template, call Brevo API, update status
 * 4. Update campaign metrics and status
 * 5. Log all operations
 * 
 * Features:
 * - Async processing (non-blocking)
 * - Exception handling (never abort on single email failure)
 * - Detailed logging
 * - Recipient status tracking
 * - Campaign completion handling
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmailCampaignSendingService {
    
    private final EmailCampaignRepository campaignRepository;
    private final EmailCampaignRecipientRepository recipientRepository;
    private final BrevoEmailService brevoEmailService;
    private final ObjectMapper objectMapper;

    @Value("${app.campaign-tracking-base-url:http://localhost:8080}")
    private String campaignTrackingBaseUrl;

    @Transactional(noRollbackFor = Exception.class)
    public void sendSingleRecipient(Long campaignId, Long recipientId) {
        EmailCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found: " + campaignId));
        EmailCampaignRecipient recipient = recipientRepository.findByIdAndCampaignId(recipientId, campaignId)
                .orElseThrow(() -> new IllegalArgumentException("Recipient does not belong to campaign"));

        if (recipient.getAutomation() == null || recipient.getExecution() == null ||
            recipient.getAutomationStep() == null ||
            !recipient.getCampaign().getWorkspace().getId().equals(recipient.getAutomation().getWorkspace().getId()) ||
            !recipient.getAutomation().getId().equals(recipient.getExecution().getAutomation().getId()) ||
            !recipient.getAutomation().getId().equals(recipient.getAutomationStep().getAutomation().getId())) {
            throw new IllegalArgumentException("Recipient automation context does not match campaign ownership");
        }

        if ("SENT".equals(recipient.getStatus())) {
            return;
        }
        try {
            EmailTemplate template = campaign.getTemplate();
            String emailContent = campaign.getCustomHtmlContent() != null && !campaign.getCustomHtmlContent().trim().isEmpty()
                    ? campaign.getCustomHtmlContent()
                    : (template != null ? template.getHtmlContent() : "");
            if (emailContent.trim().isEmpty()) {
                throw new IllegalArgumentException("Campaign has no email content");
            }
            String subject = campaign.getSubject() != null ? campaign.getSubject()
                    : (template != null ? template.getSubjectTemplate() : "Your Email");
            String renderedSubject = renderTemplate(subject, recipient);
            String renderedHtml = renderTemplate(emailContent, recipient);
            String baseUrl = campaignTrackingBaseUrl.replaceAll("/$", "");
            if (campaign.getCtaButtonUrl() != null && !campaign.getCtaButtonUrl().isEmpty()) {
                String ctaText = campaign.getCtaButtonText() != null && !campaign.getCtaButtonText().isEmpty()
                        ? campaign.getCtaButtonText() : "Learn More";
                String trackingUrl = String.format("%s/api/campaigns/track/click?campaignId=%d&recipientId=%d&redirect=%s",
                        baseUrl, campaignId, recipientId,
                        java.net.URLEncoder.encode(campaign.getCtaButtonUrl(), java.nio.charset.StandardCharsets.UTF_8));
                renderedHtml += String.format("<div style=\"text-align: center; margin: 30px 0;\"><a href=\"%s\">%s</a></div>", trackingUrl, ctaText);
            }
            renderedHtml += String.format("\n<img src=\"%s/api/campaigns/track/open?campaignId=%d&recipientId=%d\" width=\"1\" height=\"1\" style=\"display:none;\" />",
                    baseUrl, campaignId, recipientId);

            Map<String, Object> metadata = new java.util.HashMap<>();
            metadata.put("workspace_id", campaign.getWorkspace().getId());
            metadata.put("campaign_id", campaignId);
            metadata.put("recipient_id", recipientId);
            metadata.put("automation_id", recipient.getAutomation().getId());
            metadata.put("execution_id", recipient.getExecution().getId());
            metadata.put("automation_step_id", recipient.getAutomationStep().getId());
                String providerResponse = brevoEmailService.sendEmail(
                    recipient.getRecipientEmail(),
                    renderedSubject,
                    renderedHtml,
                    renderedHtml.replaceAll("<[^>]*>", ""),
                    metadata);
            recipient.setProviderMessageId(extractProviderMessageId(providerResponse));
            recipient.setStatus("SENT");
            recipient.setSentAt(LocalDateTime.now());
            recipientRepository.save(recipient);
        } catch (Exception ex) {
            recipient.setStatus("FAILED");
            recipient.setErrorMessage(sanitizeError(ex.getMessage()));
            recipientRepository.save(recipient);
            throw ex;
        }
    }

    private String extractProviderMessageId(String response) {
        if (response == null || response.isBlank()) return null;
        try {
            return objectMapper.readTree(response).path("messageId").asText(null);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String sanitizeError(String message) {
        if (message == null) return "Email delivery failed";
        return message.replaceAll("(?i)(api-key|authorization|token)[^,; ]*", "$1=[REDACTED]")
                .substring(0, Math.min(message.length(), 1000));
    }
    
    /**
     * Send campaign asynchronously.
     * Does not block HTTP response.
     * Processes all recipients and updates campaign status.
     * 
     * TRANSACTION HANDLING:
     * - Class-level @Transactional is NOT used by @Async methods
     * - Each database operation should use its own transaction
     * - We wrap individual saves in try-catch to prevent one failure from stopping others
     */
    @Async
    public void sendCampaignAsync(Long campaignId) {
        log.info("═══════════════════════════════════════════════════════════════════════════════");
        log.info("ASYNC EMAIL CAMPAIGN SEND - START (Campaign ID: {})", campaignId);
        log.info("═══════════════════════════════════════════════════════════════════════════════");
        
        try {
            // Step 1: Load campaign
            EmailCampaign campaign = campaignRepository.findById(campaignId)
                    .orElseThrow(() -> new RuntimeException("Campaign not found: " + campaignId));
            
            log.info("[STEP 1] Campaign loaded: {} (ID: {}, Status: {})", 
                    campaign.getName(), campaign.getId(), campaign.getStatus());
            
            // Step 2: Load template (optional now - can use custom HTML)
            EmailTemplate template = campaign.getTemplate();
            log.info("[STEP 2] Template loaded: {}", template != null ? template.getName() + " (ID: " + template.getId() + ")" : "NONE - using custom HTML");
            
            // Check if we have either a template OR custom HTML content
            if (template == null && (campaign.getCustomHtmlContent() == null || campaign.getCustomHtmlContent().trim().isEmpty())) {
                log.error("[STEP 2] Campaign has no template and no custom HTML content");
                updateCampaignFailed(campaign, "Campaign must have either a template or custom HTML content");
                return;
            }
            
            // Step 3: Load all recipients with status = PENDING
            log.info("[STEP 3] Loading recipients with status=PENDING...");
            Pageable pageable = PageRequest.of(0, 1000);  // Process 1000 at a time
            Page<EmailCampaignRecipient> recipientPage;
            long totalRecipients = 0;
            long successCount = 0;
            long failureCount = 0;
            
            int pageNumber = 0;
            boolean hasMore = true;
            
            while (hasMore) {
                pageable = PageRequest.of(pageNumber, 1000);
                recipientPage = recipientRepository.findByCampaignIdAndStatusOrderByCreatedAtDesc(
                        campaignId, "PENDING", pageable);
                
                if (recipientPage.isEmpty()) {
                    hasMore = false;
                    break;
                }
                
                totalRecipients += recipientPage.getContent().size();
                log.info("[STEP 3] Page {} loaded with {} recipients", pageNumber, recipientPage.getContent().size());
                
                // Step 4: Process each recipient
                for (EmailCampaignRecipient recipient : recipientPage.getContent()) {
                    try {
                        log.info("[STEP 4] Processing recipient: {} (ID: {})", 
                                recipient.getRecipientEmail(), recipient.getId());
                        
                        // Get email content: either custom HTML or template HTML
                        String emailContent = campaign.getCustomHtmlContent() != null && !campaign.getCustomHtmlContent().trim().isEmpty()
                            ? campaign.getCustomHtmlContent()
                            : (template != null && template.getHtmlContent() != null ? template.getHtmlContent() : "");
                        
                        // SAFETY CHECK: Prevent empty email body
                        if (emailContent == null || emailContent.trim().isEmpty()) {
                            log.error("[STEP 4] Email content is empty for recipient: {}", recipient.getRecipientEmail());
                            recipient.setStatus("FAILED");
                            recipient.setErrorMessage("Email content is empty - no template or custom HTML provided");
                            recipientRepository.save(recipient);
                            failureCount++;
                            continue;  // Skip this recipient
                        }
                        
                        // Add CTA button if configured
                        if (campaign.getCtaButtonUrl() != null && !campaign.getCtaButtonUrl().isEmpty()) {
                            String ctaButtonText = campaign.getCtaButtonText() != null && !campaign.getCtaButtonText().isEmpty()
                                ? campaign.getCtaButtonText()
                                : "Learn More";
                            
                            // Generate tracking URL for click tracking
                            // Emails execute outside our domain, so links must use the public absolute API origin.
                            String trackingUrl = String.format(
                                "%s/api/campaigns/track/click?campaignId=%d&recipientId=%d&redirect=%s",
                                campaignTrackingBaseUrl.replaceAll("/$", ""),
                                campaign.getId(),
                                recipient.getId(),
                                java.net.URLEncoder.encode(campaign.getCtaButtonUrl(), "UTF-8")
                            );
                            
                            String ctaHtml = String.format(
                                "<div style=\"text-align: center; margin: 30px 0;\">" +
                                "  <a href=\"%s\" style=\"display: inline-block; padding: 15px 40px; background-color: #3b82f6; " +
                                "color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;\">" +
                                "%s</a>" +
                                "</div>",
                                trackingUrl,
                                ctaButtonText
                            );
                            
                            // Append CTA to email content
                            emailContent = emailContent + ctaHtml;
                            log.info("[STEP 4] CTA button added with click tracking: {} (tracking: {})", ctaButtonText, trackingUrl);
                        }
                        
                        // Render email template
                        String renderedSubject = renderTemplate(
                                campaign.getSubject() != null ? campaign.getSubject() : (template != null ? template.getSubjectTemplate() : ""),
                                recipient
                        );
                        
                        // SAFETY CHECK: Ensure rendered subject is not empty
                        if (renderedSubject == null || renderedSubject.trim().isEmpty()) {
                            renderedSubject = "Your Email";
                            log.warn("[STEP 4] Subject was empty, using default: {}", renderedSubject);
                        }
                        
                        String renderedHtml = renderTemplate(
                                emailContent,
                                recipient
                        );
                        
                        // SAFETY CHECK: Ensure rendered HTML is not empty before sending to Brevo
                        if (renderedHtml == null || renderedHtml.trim().isEmpty()) {
                            log.error("[STEP 4] Rendered HTML is empty for recipient: {}", recipient.getRecipientEmail());
                            recipient.setStatus("FAILED");
                            recipient.setErrorMessage("Rendered HTML is empty after template processing");
                            recipientRepository.save(recipient);
                            failureCount++;
                            continue;  // Skip this recipient
                        }
                        
                        // Add open tracking pixel to the end of the email
                        String trackingPixel = String.format(
                            "<img src=\"%s/api/campaigns/track/open?campaignId=%d&recipientId=%d\" width=\"1\" height=\"1\" style=\"display:none;\" />",
                            campaignTrackingBaseUrl.replaceAll("/$", ""),
                            campaign.getId(),
                            recipient.getId()
                        );
                        renderedHtml = renderedHtml + "\n" + trackingPixel;
                        log.info("[STEP 4] Open tracking pixel added to email");
                        
                        log.info("[STEP 4] Template rendered for: {}", recipient.getRecipientEmail());
                        log.info("[STEP 4] Rendered Subject: {}", renderedSubject);
                        log.info("[STEP 4] Rendered HTML length: {} bytes", renderedHtml.length());
                        
                        // Call Brevo API
                        log.info("[STEP 4] Calling BrevoEmailService.sendEmail()...");
                        log.info("[DEBUG] Metadata for Brevo: campaign_id={}, recipient_id={}", campaign.getId(), recipient.getId());
                        String providerResponse = brevoEmailService.sendEmail(
                            recipient.getRecipientEmail(),
                            renderedSubject,
                            renderedHtml,
                            renderedHtml.replaceAll("<[^>]*>", ""),
                            Map.of(
                                "campaign_id", campaign.getId(),
                                "recipient_id", recipient.getId()
                            )
                        );
                        recipient.setProviderMessageId(extractProviderMessageId(providerResponse));
                        
                        // Update recipient status to SENT on success
                        saveRecipientAsync(recipient);
                        successCount++;
                        
                        log.info("[STEP 4] ✓ Email sent successfully to: {} (recipient ID: {})", 
                                recipient.getRecipientEmail(), recipient.getId());
                        
                    } catch (HttpStatusCodeException ex) {
                        // Brevo API error
                        log.error("[STEP 4] ✗ Brevo API error for {}: {} - {}", 
                                recipient.getRecipientEmail(), ex.getStatusCode(), ex.getResponseBodyAsString());
                        
                        recipient.setStatus("FAILED");
                        recipient.setErrorMessage("Brevo API error: " + ex.getStatusCode() + " - " + ex.getResponseBodyAsString());
                        recipientRepository.save(recipient);
                        failureCount++;
                        
                        // Continue processing other recipients
                        
                    } catch (Exception ex) {
                        // Unexpected error
                        log.error("[STEP 4] ✗ Unexpected error for {}: {}", 
                                recipient.getRecipientEmail(), ex.getMessage(), ex);
                        
                        recipient.setStatus("FAILED");
                        recipient.setErrorMessage("Unexpected error: " + ex.getMessage());
                        recipientRepository.save(recipient);
                        failureCount++;
                        
                        // Continue processing other recipients
                    }
                }
                
                pageNumber++;
            }
            
            // Step 5: Update campaign with metrics
            log.info("[STEP 5] Updating campaign metrics...");
            campaign.setTotalRecipients(totalRecipients);
            campaign.setSentCount(successCount);
            campaign.setFailedCount(failureCount);
            
            // Set status based on results
            if (successCount > 0 && failureCount == 0) {
                campaign.setStatus("SENT");
            } else if (successCount > 0 && failureCount > 0) {
                campaign.setStatus("PARTIAL");  // Some sent, some failed
            } else if (failureCount > 0 && successCount == 0) {
                campaign.setStatus("FAILED");  // All failed
            } else {
                campaign.setStatus("COMPLETED");  // No recipients
            }
            
            campaign.setSendCompletedAt(LocalDateTime.now());
            campaignRepository.save(campaign);
            
            log.info("[STEP 5] Campaign updated:");
            log.info("         Status: {}", campaign.getStatus());
            log.info("         Total Recipients: {}", totalRecipients);
            log.info("         Sent: {}", successCount);
            log.info("         Failed: {}", failureCount);
            log.info("         Send Completed At: {}", campaign.getSendCompletedAt());
            
            log.info("═══════════════════════════════════════════════════════════════════════════════");
            log.info("ASYNC EMAIL CAMPAIGN SEND - SUCCESS");
            log.info("═══════════════════════════════════════════════════════════════════════════════");
            
        } catch (Exception ex) {
            log.error("═══════════════════════════════════════════════════════════════════════════════");
            log.error("ASYNC EMAIL CAMPAIGN SEND - CRITICAL ERROR");
            log.error("═══════════════════════════════════════════════════════════════════════════════");
            log.error("Error sending campaign: {}", ex.getMessage(), ex);
            
            // Update campaign to FAILED status to prevent infinite SENDING state
            try {
                EmailCampaign campaign = campaignRepository.findById(campaignId).orElse(null);
                if (campaign != null) {
                    updateCampaignFailed(campaign, "Critical error: " + ex.getMessage());
                }
            } catch (Exception updateEx) {
                log.error("Failed to update campaign status: {}", updateEx.getMessage(), updateEx);
            }
        }
    }
    
    /**
     * Render template by replacing {{variables}} with recipient data.
     * 
     * Supports:
     * - {{firstName}}
     * - {{email}}
     * - {{company}}
     * - Custom variables from recipient.recipientVariables
     */
    private String renderTemplate(String template, EmailCampaignRecipient recipient) {
        if (template == null) {
            return "";
        }
        
        String rendered = template;
        
        // Replace standard fields
        rendered = rendered.replace("{{firstName}}", recipient.getRecipientName() != null ? recipient.getRecipientName() : "");
        rendered = rendered.replace("{{email}}", recipient.getRecipientEmail());
        rendered = rendered.replace("{{company}}", recipient.getRecipientCompany() != null ? recipient.getRecipientCompany() : "");
        
        // Replace custom variables from recipient.recipientVariables
        if (recipient.getRecipientVariables() != null && !recipient.getRecipientVariables().isEmpty()) {
            try {
                Map<String, Object> variables = objectMapper.readValue(
                        recipient.getRecipientVariables(), 
                        Map.class
                );
                
                for (Map.Entry<String, Object> entry : variables.entrySet()) {
                    String key = entry.getKey();
                    Object value = entry.getValue();
                    if (value != null) {
                        rendered = rendered.replace("{{" + key + "}}", value.toString());
                    }
                }
            } catch (Exception ex) {
                log.warn("Failed to parse recipient variables for {}: {}", 
                        recipient.getRecipientEmail(), ex.getMessage());
            }
        }
        
        return rendered;
    }
    
    /**
     * Mark campaign as FAILED and set error message.
     */
    private void updateCampaignFailed(EmailCampaign campaign, String errorMessage) {
        campaign.setStatus("FAILED");
        campaign.setSendCompletedAt(LocalDateTime.now());
        campaign.setFailedCount(campaign.getTotalRecipients() != null ? campaign.getTotalRecipients() : 0L);
        campaignRepository.save(campaign);
        
        log.error("Campaign marked as FAILED: {} - {}", campaign.getId(), errorMessage);
    }

    /**
     * Save recipient with individual transaction context
     * Ensures each recipient update is persisted even if others fail
     * 
     * CRITICAL: @Async methods lose the class-level @Transactional context
     * This method ensures each database operation completes in its own transaction
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    private void saveRecipientAsync(EmailCampaignRecipient recipient) {
        try {
            recipient.setStatus("SENT");
            recipient.setSentAt(LocalDateTime.now());
            recipientRepository.save(recipient);
        } catch (Exception ex) {
            log.error("Failed to save recipient {}: {}", recipient.getRecipientEmail(), ex.getMessage());
            // Don't rethrow - continue processing other recipients
        }
    }

    /**
     * Save campaign with individual transaction context
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    private void saveCampaignAsync(EmailCampaign campaign) {
        try {
            campaignRepository.save(campaign);
        } catch (Exception ex) {
            log.error("Failed to save campaign {}: {}", campaign.getId(), ex.getMessage());
            // Don't rethrow - this is a background task
        }
    }
}
