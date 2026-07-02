package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.CreateLeadRequest;
import com.arjun.crm.dto.request.UpdateLeadRequest;
import com.arjun.crm.dto.request.UpdateLeadStatusRequest;
import com.arjun.crm.dto.response.LeadActivityResponse;
import com.arjun.crm.dto.response.LeadAnalyticsResponse;
import com.arjun.crm.dto.response.LeadResponse;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.entity.LeadActivity;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.LeadStatus;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.DuplicateEmailException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.event.LeadAssignedEvent;
import com.arjun.crm.event.LeadUpdatedEvent;
import com.arjun.crm.repository.LeadActivityRepository;
import com.arjun.crm.repository.LeadRepository;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.repository.WorkspaceMemberRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.service.LeadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeadServiceImpl implements LeadService {
    
    private final LeadRepository leadRepository;
    private final LeadActivityRepository leadActivityRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ApplicationEventPublisher eventPublisher;
    
    @Override
    public LeadResponse createLead(CreateLeadRequest request, Long userId) {
        log.info("Creating lead for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Check workspace access
        validateWorkspaceAccess(userId, workspace.getId());
        
        // Check duplicate email
        if (leadRepository.existsByEmailAndWorkspaceId(request.getEmail(), workspace.getId())) {
            throw new DuplicateEmailException("Lead with this email already exists in workspace");
        }
        
        User assignedTo = null;
        if (request.getAssignedToId() != null) {
            assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found"));
            validateWorkspaceAccess(request.getAssignedToId(), workspace.getId());
        }
        
        Lead lead = Lead.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .company(request.getCompany())
                .position(request.getPosition())
                .dealValue(request.getDealValue() != null ? request.getDealValue() : BigDecimal.ZERO)
                .status(request.getStatus())
                .priority(request.getPriority())
                .assignedTo(assignedTo)
                .workspace(workspace)
                .tags(request.getTags())
                .notes(request.getNotes())
                .expectedCloseDate(request.getExpectedCloseDate())
                .lastActivityAt(LocalDateTime.now())
                .createdBy(user)
                .build();
        
        lead = leadRepository.save(lead);
        
        // Create activity
        createActivity(lead, user, "CREATED", "Lead created", null, null);
        
        if (assignedTo != null) {
            createActivity(lead, user, "ASSIGNED", "Lead assigned to " + assignedTo.getFullName(), 
                          null, assignedTo.getFullName());
            // Publish lead assigned event for notification
            eventPublisher.publishEvent(new LeadAssignedEvent(this, lead, assignedTo, user));
        }
        
        log.info("Lead created successfully: {}", lead.getId());
        return mapToResponse(lead);
    }
    
    @Override
    public LeadResponse updateLead(Long leadId, UpdateLeadRequest request, Long userId) {
        log.info("Updating lead: {} by user: {}", leadId, userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        
        validateWorkspaceAccess(userId, lead.getWorkspace().getId());
        
        // Track changes for activity log
        if (request.getName() != null && !request.getName().equals(lead.getName())) {
            createActivity(lead, user, "UPDATED", "Name changed", lead.getName(), request.getName());
            lead.setName(request.getName());
        }
        
        if (request.getEmail() != null && !request.getEmail().equals(lead.getEmail())) {
            if (leadRepository.existsByEmailAndWorkspaceId(request.getEmail(), lead.getWorkspace().getId())) {
                throw new DuplicateEmailException("Lead with this email already exists in workspace");
            }
            createActivity(lead, user, "UPDATED", "Email changed", lead.getEmail(), request.getEmail());
            lead.setEmail(request.getEmail());
        }
        
        if (request.getPhone() != null) {
            lead.setPhone(request.getPhone());
        }
        
        if (request.getCompany() != null) {
            lead.setCompany(request.getCompany());
        }
        
        if (request.getPosition() != null) {
            lead.setPosition(request.getPosition());
        }
        
        if (request.getDealValue() != null && !request.getDealValue().equals(lead.getDealValue())) {
            createActivity(lead, user, "UPDATED", "Deal value changed", 
                          lead.getDealValue().toString(), request.getDealValue().toString());
            lead.setDealValue(request.getDealValue());
        }
        
        if (request.getStatus() != null && !request.getStatus().equals(lead.getStatus())) {
            createActivity(lead, user, "STATUS_CHANGED", "Status changed", 
                          lead.getStatus().name(), request.getStatus().name());
            lead.setStatus(request.getStatus());
        }
        
        if (request.getPriority() != null && !request.getPriority().equals(lead.getPriority())) {
            createActivity(lead, user, "UPDATED", "Priority changed", 
                          lead.getPriority().name(), request.getPriority().name());
            lead.setPriority(request.getPriority());
        }
        
        if (request.getAssignedToId() != null) {
            User newAssignee = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found"));
            validateWorkspaceAccess(request.getAssignedToId(), lead.getWorkspace().getId());
            
            String oldAssignee = lead.getAssignedTo() != null ? lead.getAssignedTo().getFullName() : "Unassigned";
            createActivity(lead, user, "ASSIGNED", "Lead reassigned", 
                          oldAssignee, newAssignee.getFullName());
            lead.setAssignedTo(newAssignee);
            
            // Publish lead assigned event for notification
            eventPublisher.publishEvent(new LeadAssignedEvent(this, lead, newAssignee, user));
        }
        
        if (request.getTags() != null) {
            lead.setTags(request.getTags());
        }
        
        if (request.getNotes() != null) {
            lead.setNotes(request.getNotes());
        }
        
        if (request.getExpectedCloseDate() != null) {
            lead.setExpectedCloseDate(request.getExpectedCloseDate());
        }
        
        lead.setLastActivityAt(LocalDateTime.now());
        lead = leadRepository.save(lead);
        
        // Publish lead updated event for notification
        eventPublisher.publishEvent(new LeadUpdatedEvent(this, lead, user, "Lead updated"));
        
        log.info("Lead updated successfully: {}", leadId);
        return mapToResponse(lead);
    }
    
    @Override
    public LeadResponse updateLeadStatus(Long leadId, UpdateLeadStatusRequest request, Long userId) {
        log.info("Updating lead status: {} to {} by user: {}", leadId, request.getStatus(), userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        
        validateWorkspaceAccess(userId, lead.getWorkspace().getId());
        
        LeadStatus oldStatus = lead.getStatus();
        lead.setStatus(request.getStatus());
        lead.setLastActivityAt(LocalDateTime.now());
        
        if (request.getNotes() != null && !request.getNotes().isEmpty()) {
            lead.setNotes(lead.getNotes() != null ? lead.getNotes() + "\n\n" + request.getNotes() : request.getNotes());
        }
        
        lead = leadRepository.save(lead);
        
        String description = request.getNotes() != null ? request.getNotes() : "Status changed";
        createActivity(lead, user, "STATUS_CHANGED", description, oldStatus.name(), request.getStatus().name());
        
        log.info("Lead status updated successfully: {}", leadId);
        return mapToResponse(lead);
    }
    
    @Override
    @Transactional(readOnly = true)
    public LeadResponse getLeadById(Long leadId, Long userId) {
        log.info("Fetching lead: {} for user: {}", leadId, userId);
        
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        
        validateWorkspaceAccess(userId, lead.getWorkspace().getId());
        
        return mapToResponse(lead);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<LeadResponse> getLeadsByWorkspace(Long workspaceId, Long userId, Pageable pageable) {
        log.info("Fetching leads for workspace: {} by user: {}", workspaceId, userId);
        
        validateWorkspaceAccess(userId, workspaceId);
        
        Page<Lead> leads = leadRepository.findByWorkspaceId(workspaceId, pageable);
        return leads.map(this::mapToResponse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<LeadResponse> getLeadsByFilters(Long workspaceId, LeadStatus status, Long assignedToId, 
                                                 String priority, String search, Long userId, Pageable pageable) {
        log.info("Fetching leads with filters for workspace: {}", workspaceId);
        
        validateWorkspaceAccess(userId, workspaceId);
        
        Page<Lead> leads = leadRepository.findByFilters(workspaceId, status, assignedToId, priority, search, pageable);
        return leads.map(this::mapToResponse);
    }
    
    @Override
    public void deleteLead(Long leadId, Long userId) {
        log.info("Deleting lead: {} by user: {}", leadId, userId);
        
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        
        validateWorkspaceAccess(userId, lead.getWorkspace().getId());
        
        leadRepository.delete(lead);
        log.info("Lead deleted successfully: {}", leadId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<LeadActivityResponse> getLeadActivities(Long leadId, Long userId) {
        log.info("Fetching activities for lead: {}", leadId);
        
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        
        validateWorkspaceAccess(userId, lead.getWorkspace().getId());
        
        List<LeadActivity> activities = leadActivityRepository.findTop10ByLeadIdOrderByCreatedAtDesc(leadId);
        return activities.stream().map(this::mapToActivityResponse).collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public LeadAnalyticsResponse getLeadAnalytics(Long workspaceId, Long userId) {
        log.info("Fetching lead analytics for workspace: {}", workspaceId);
        
        validateWorkspaceAccess(userId, workspaceId);
        
        Long totalLeads = leadRepository.countByWorkspaceId(workspaceId);
        
        BigDecimal totalValue = BigDecimal.ZERO;
        BigDecimal wonValue = leadRepository.sumDealValueByWorkspaceIdAndStatus(workspaceId, LeadStatus.WON);
        BigDecimal lostValue = leadRepository.sumDealValueByWorkspaceIdAndStatus(workspaceId, LeadStatus.LOST);
        
        wonValue = wonValue != null ? wonValue : BigDecimal.ZERO;
        lostValue = lostValue != null ? lostValue : BigDecimal.ZERO;
        
        // Calculate total pipeline value
        for (LeadStatus status : LeadStatus.values()) {
            BigDecimal statusValue = leadRepository.sumDealValueByWorkspaceIdAndStatus(workspaceId, status);
            if (statusValue != null) {
                totalValue = totalValue.add(statusValue);
            }
        }
        
        // Calculate conversion rate
        Long wonCount = leadRepository.countByWorkspaceIdAndStatus(workspaceId, LeadStatus.WON);
        Long lostCount = leadRepository.countByWorkspaceIdAndStatus(workspaceId, LeadStatus.LOST);
        Double conversionRate = 0.0;
        if (wonCount + lostCount > 0) {
            conversionRate = (wonCount.doubleValue() / (wonCount + lostCount)) * 100;
            conversionRate = BigDecimal.valueOf(conversionRate).setScale(2, RoundingMode.HALF_UP).doubleValue();
        }
        
        // Leads by status
        Map<String, Long> leadsByStatus = new HashMap<>();
        Map<String, BigDecimal> valueByStatus = new HashMap<>();
        List<Object[]> statusCounts = leadRepository.countByStatusGrouped(workspaceId);
        for (Object[] row : statusCounts) {
            LeadStatus status = (LeadStatus) row[0];
            Long count = (Long) row[1];
            leadsByStatus.put(status.name(), count);
            
            BigDecimal value = leadRepository.sumDealValueByWorkspaceIdAndStatus(workspaceId, status);
            valueByStatus.put(status.name(), value != null ? value : BigDecimal.ZERO);
        }
        
        // Assignee performance
        List<Object[]> performanceData = leadRepository.getPerformanceByAssignee(workspaceId);
        List<LeadAnalyticsResponse.AssigneePerformance> assigneePerformance = performanceData.stream()
                .map(row -> LeadAnalyticsResponse.AssigneePerformance.builder()
                        .userId((Long) row[0])
                        .userName((String) row[1])
                        .leadsCount((Long) row[2])
                        .totalValue((BigDecimal) row[3])
                        .build())
                .collect(Collectors.toList());
        
        return LeadAnalyticsResponse.builder()
                .totalLeads(totalLeads)
                .totalPipelineValue(totalValue)
                .wonValue(wonValue)
                .lostValue(lostValue)
                .conversionRate(conversionRate)
                .leadsByStatus(leadsByStatus)
                .valueByStatus(valueByStatus)
                .assigneePerformance(assigneePerformance)
                .build();
    }
    
    private void validateWorkspaceAccess(Long userId, Long workspaceId) {
        // PHASE 6: Check if user is ACTIVE member (Phase 2 soft delete validation)
        if (!workspaceMemberRepository.existsActiveMember(workspaceId, userId)) {
            throw new AccessDeniedException("You don't have access to this workspace");
        }
    }
    
    private void createActivity(Lead lead, User user, String activityType, String description, 
                                String oldValue, String newValue) {
        LeadActivity activity = LeadActivity.builder()
                .lead(lead)
                .user(user)
                .activityType(activityType)
                .description(description)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();
        leadActivityRepository.save(activity);
    }
    
    private LeadResponse mapToResponse(Lead lead) {
        return LeadResponse.builder()
                .id(lead.getId())
                .name(lead.getName())
                .email(lead.getEmail())
                .phone(lead.getPhone())
                .company(lead.getCompany())
                .position(lead.getPosition())
                .dealValue(lead.getDealValue())
                .status(lead.getStatus())
                .priority(lead.getPriority())
                .assignedTo(lead.getAssignedTo() != null ? mapToUserSummary(lead.getAssignedTo()) : null)
                .workspaceId(lead.getWorkspace().getId())
                .tags(lead.getTags())
                .notes(lead.getNotes())
                .expectedCloseDate(lead.getExpectedCloseDate())
                .lastActivityAt(lead.getLastActivityAt())
                .createdBy(mapToUserSummary(lead.getCreatedBy()))
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .build();
    }
    
    private LeadResponse.UserSummary mapToUserSummary(User user) {
        return LeadResponse.UserSummary.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();
    }
    
    private LeadActivityResponse mapToActivityResponse(LeadActivity activity) {
        return LeadActivityResponse.builder()
                .id(activity.getId())
                .leadId(activity.getLead().getId())
                .user(LeadActivityResponse.UserSummary.builder()
                        .id(activity.getUser().getId())
                        .fullName(activity.getUser().getFullName())
                        .email(activity.getUser().getEmail())
                        .build())
                .activityType(activity.getActivityType())
                .description(activity.getDescription())
                .oldValue(activity.getOldValue())
                .newValue(activity.getNewValue())
                .createdAt(activity.getCreatedAt())
                .build();
    }
}
