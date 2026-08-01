package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.AddRecipientsRequest;
import com.arjun.crm.dto.response.EmailCampaignRecipientResponse;
import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailCampaignRecipient;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.EmailCampaignRecipientRepository;
import com.arjun.crm.repository.EmailCampaignRepository;
import com.arjun.crm.repository.LeadRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.EmailCampaignRecipientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * EmailCampaignRecipientServiceImpl - FEATURE #3
 * 
 * Implementation of email campaign recipient management
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmailCampaignRecipientServiceImpl implements EmailCampaignRecipientService {
    
    private final EmailCampaignRecipientRepository recipientRepository;
    private final EmailCampaignRepository campaignRepository;
    private final LeadRepository leadRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;
    
    @Override
    public void addRecipients(Long workspaceId, Long campaignId, AddRecipientsRequest request) {
        log.info("Adding recipients to campaign {} in workspace: {}", campaignId, workspaceId);
        
        // Validate permission
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Get campaign
        EmailCampaign campaign = campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        
        // Handle segment-based recipients (future implementation)
        if (request.getSegmentId() != null) {
            log.info("Adding recipients from segment: {}", request.getSegmentId());
            // TODO: Implement segment-based recipient addition
        }
        
        // Handle manual recipients
        if (request.getRecipients() != null) {
            boolean replaceExisting = request.getReplaceExisting() != null && request.getReplaceExisting();
            
            if (replaceExisting) {
                // Delete existing recipients
                recipientRepository.findByCampaignIdOrderByCreatedAtDesc(campaignId, Pageable.unpaged())
                        .forEach(r -> recipientRepository.delete(r));
                campaign.setTotalRecipients(0L);
            }
            
            long addedCount = 0;
            for (AddRecipientsRequest.RecipientData recipientData : request.getRecipients()) {
                // Check if already exists
                if (recipientRepository.findByCampaignIdAndRecipientEmail(campaignId, recipientData.getEmail()).isEmpty()) {
                    
                    // Try to find associated lead
                    Lead lead = leadRepository.findByNormalizedEmailAndWorkspaceId(
                            recipientData.getEmail().toLowerCase().trim(), workspaceId).orElse(null);
                    
                    EmailCampaignRecipient recipient = EmailCampaignRecipient.builder()
                            .campaign(campaign)
                            .lead(lead)
                            .recipientEmail(recipientData.getEmail())
                            .recipientName(recipientData.getName())
                            .recipientCompany(recipientData.getCompany())
                            .recipientVariables(recipientData.getVariables())
                            .status("PENDING")
                            .deliveryAttempts(0)
                            .build();
                    
                    recipientRepository.save(recipient);
                    addedCount++;
                }
            }
            
            campaign.setTotalRecipients(campaign.getTotalRecipients() + addedCount);
            campaignRepository.save(campaign);
            log.info("Added {} recipients to campaign {}", addedCount, campaignId);
        }
    }
    
    @Override
    public Page<EmailCampaignRecipientResponse> listRecipients(Long workspaceId, Long campaignId, Pageable pageable) {
        log.info("Listing recipients for campaign {} in workspace: {}", campaignId, workspaceId);
        
        // Validate access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        // Verify campaign belongs to workspace
        campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        
        return recipientRepository.findByCampaignIdOrderByCreatedAtDesc(campaignId, pageable)
                .map(this::mapToResponse);
    }
    
    @Override
    public EmailCampaignRecipientResponse getRecipient(Long workspaceId, Long campaignId, Long recipientId) {
        log.info("Getting recipient {} for campaign {} in workspace: {}", recipientId, campaignId, workspaceId);
        
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        // Verify campaign belongs to workspace
        campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        
        EmailCampaignRecipient recipient = recipientRepository.findByIdAndCampaignId(recipientId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));
        
        return mapToResponse(recipient);
    }
    
    @Override
    public void removeRecipient(Long workspaceId, Long campaignId, Long recipientId) {
        log.info("Removing recipient {} from campaign {} in workspace: {}", recipientId, campaignId, workspaceId);
        
        // Validate permission
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Verify campaign belongs to workspace
        EmailCampaign campaign = campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        
        EmailCampaignRecipient recipient = recipientRepository.findByIdAndCampaignId(recipientId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));
        
        recipientRepository.delete(recipient);
        
        // Update campaign recipient count
        campaign.setTotalRecipients(campaign.getTotalRecipients() - 1);
        campaignRepository.save(campaign);
        
        log.info("Recipient removed from campaign");
    }
    
    private EmailCampaignRecipientResponse mapToResponse(EmailCampaignRecipient recipient) {
        return EmailCampaignRecipientResponse.builder()
                .id(recipient.getId())
                .campaignId(recipient.getCampaign().getId())
                .leadId(recipient.getLead() != null ? recipient.getLead().getId() : null)
                .recipientEmail(recipient.getRecipientEmail())
                .recipientName(recipient.getRecipientName())
                .recipientCompany(recipient.getRecipientCompany())
                .status(recipient.getStatus())
                .bounceType(recipient.getBounceType())
                .deliveryAttempts(recipient.getDeliveryAttempts())
                .sentAt(recipient.getSentAt())
                .deliveredAt(recipient.getDeliveredAt())
                .openedAt(recipient.getOpenedAt())
                .firstClickedAt(recipient.getFirstClickedAt())
                .lastClickedAt(recipient.getLastClickedAt())
                .clickCount(recipient.getClickCount())
                .unsubscribedAt(recipient.getUnsubscribedAt())
                .errorMessage(recipient.getErrorMessage())
                .createdAt(recipient.getCreatedAt())
                .updatedAt(recipient.getUpdatedAt())
                .build();
    }
}
