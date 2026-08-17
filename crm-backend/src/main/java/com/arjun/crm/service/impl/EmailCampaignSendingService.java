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
    
    /**
     * Send campaign asynchronously.
     * Does not block HTTP response.
     * Processes all recipients and updates campaign status.
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
                            
                            String ctaHtml = String.format(
                                "<div style=\"text-align: center; margin: 30px 0;\">" +
                                "  <a href=\"%s\" style=\"display: inline-block; padding: 15px 40px; background-color: #3b82f6; " +
                                "color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;\">" +
                                "%s</a>" +
                                "</div>",
                                campaign.getCtaButtonUrl(),
                                ctaButtonText
                            );
                            
                            // Append CTA to email content
                            emailContent = emailContent + ctaHtml;
                            log.info("[STEP 4] CTA button added: {} ({})", ctaButtonText, campaign.getCtaButtonUrl());
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
                        
                        log.info("[STEP 4] Template rendered for: {}", recipient.getRecipientEmail());
                        log.info("[STEP 4] Rendered Subject: {}", renderedSubject);
                        log.info("[STEP 4] Rendered HTML length: {} bytes", renderedHtml.length());
                        
                        // Call Brevo API
                        log.info("[STEP 4] Calling BrevoEmailService.sendEmail()...");
                        log.info("[DEBUG] Metadata for Brevo: campaign_id={}, recipient_id={}", campaign.getId(), recipient.getId());
                        try {
                            brevoEmailService.sendEmail(
                                    recipient.getRecipientEmail(),
                                    renderedSubject,
                                    renderedHtml,
                                    Map.of(
                                            "campaign_id", campaign.getId(),
                                            "recipient_id", recipient.getId()
                                    )
                            );
                        } catch (Exception metadataEx) {
                            log.warn("[DEBUG] Retrying without metadata after failure: {}", metadataEx.getMessage());
                            // Retry without metadata
                            brevoEmailService.sendEmail(
                                    recipient.getRecipientEmail(),
                                    renderedSubject,
                                    renderedHtml,
                                    null
                            );
                        }
                        
                        // Update recipient status to SENT on success
                        recipient.setStatus("SENT");
                        recipient.setSentAt(LocalDateTime.now());
                        recipientRepository.save(recipient);
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
}
