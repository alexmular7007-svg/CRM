package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.CreateEmailSegmentRequest;
import com.arjun.crm.dto.response.EmailCampaignSegmentResponse;
import com.arjun.crm.entity.EmailCampaignSegment;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.repository.EmailCampaignSegmentRepository;
import com.arjun.crm.repository.WorkspaceRepository;
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
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;
    
    @Override
    public EmailCampaignSegmentResponse createSegment(Long workspaceId, CreateEmailSegmentRequest request) {
        log.info("Creating email segment in workspace: {}", workspaceId);
        
        User authenticatedUser = workspaceAuthService.getAuthenticatedUser();
        
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        if (segmentRepository.existsByWorkspaceIdAndName(workspaceId, request.getName())) {
            throw new ConflictException("Segment name already exists in this workspace");
        }
        
        EmailCampaignSegment segment = EmailCampaignSegment.builder()
                .workspace(workspace)
                .name(request.getName())
                .description(request.getDescription())
                .filterCriteria(request.getFilterCriteria())
                .leadCount(0L)
                .createdBy(authenticatedUser)
                .build();
        
        segment = segmentRepository.save(segment);
        log.info("Segment created: {} (ID: {})", segment.getName(), segment.getId());
        
        return mapToResponse(segment);
    }
    
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
    
    @Override
    public void deleteSegment(Long workspaceId, Long segmentId) {
        log.info("Deleting segment {} in workspace: {}", segmentId, workspaceId);
        
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        EmailCampaignSegment segment = segmentRepository.findByIdAndWorkspaceId(segmentId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Segment not found"));
        
        segmentRepository.delete(segment);
        log.info("Segment deleted: {} (ID: {})", segment.getName(), segment.getId());
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
