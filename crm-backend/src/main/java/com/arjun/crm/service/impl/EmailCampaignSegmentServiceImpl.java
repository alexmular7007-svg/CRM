package com.arjun.crm.service.impl;

import com.arjun.crm.dto.response.EmailCampaignSegmentResponse;
import com.arjun.crm.entity.EmailCampaignSegment;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.EmailCampaignSegmentRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.EmailCampaignSegmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * EmailCampaignSegmentServiceImpl - FEATURE #3
 * 
 * Implementation of email campaign segment management
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmailCampaignSegmentServiceImpl implements EmailCampaignSegmentService {
    
    private final EmailCampaignSegmentRepository segmentRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;
    
    @Override
    public Page<EmailCampaignSegmentResponse> listSegments(Long workspaceId, Pageable pageable) {
        log.info("Listing segments in workspace: {}", workspaceId);
        
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        return segmentRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId, pageable)
                .map(this::mapToResponse);
    }
    
    @Override
    public EmailCampaignSegmentResponse getSegment(Long workspaceId, Long segmentId) {
        log.info("Getting segment {} in workspace: {}", segmentId, workspaceId);
        
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        EmailCampaignSegment segment = segmentRepository.findByIdAndWorkspaceId(segmentId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Segment not found"));
        
        return mapToResponse(segment);
    }
    
    private EmailCampaignSegmentResponse mapToResponse(EmailCampaignSegment segment) {
        return EmailCampaignSegmentResponse.builder()
                .id(segment.getId())
                .name(segment.getName())
                .description(segment.getDescription())
                .filterCriteria(segment.getFilterCriteria())
                .leadCount(segment.getLeadCount())
                .createdById(segment.getCreatedBy().getId())
                .createdByName(segment.getCreatedBy().getFullName())
                .createdAt(segment.getCreatedAt())
                .updatedAt(segment.getUpdatedAt())
                .build();
    }
}
