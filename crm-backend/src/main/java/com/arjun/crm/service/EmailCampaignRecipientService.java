package com.arjun.crm.service;

import com.arjun.crm.dto.request.AddRecipientsRequest;
import com.arjun.crm.dto.response.EmailCampaignRecipientResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * EmailCampaignRecipientService - FEATURE #3
 * 
 * Service interface for email campaign recipient management
 * 
 * Permission Model:
 * - OWNER/ADMIN: Full access (add, remove, update status)
 * - MEMBER: Read-only access
 */
public interface EmailCampaignRecipientService {
    
    /**
     * Add recipients to campaign
     * 
     * Permission: OWNER/ADMIN only
     */
    void addRecipients(Long workspaceId, Long campaignId, AddRecipientsRequest request);
    
    /**
     * List recipients for campaign
     * 
     * Permission: Any workspace member
     */
    Page<EmailCampaignRecipientResponse> listRecipients(Long workspaceId, Long campaignId, Pageable pageable);
    
    /**
     * Get recipient details
     * 
     * Permission: Any workspace member
     */
    EmailCampaignRecipientResponse getRecipient(Long workspaceId, Long campaignId, Long recipientId);
    
    /**
     * Remove recipient from campaign
     * 
     * Permission: OWNER/ADMIN only
     */
    void removeRecipient(Long workspaceId, Long campaignId, Long recipientId);
}
