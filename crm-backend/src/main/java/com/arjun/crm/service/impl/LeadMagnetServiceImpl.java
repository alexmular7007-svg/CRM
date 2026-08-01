package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.LeadMagnetCreateRequest;
import com.arjun.crm.dto.request.LeadMagnetSubmissionRequest;
import com.arjun.crm.dto.request.LeadMagnetUpdateRequest;
import com.arjun.crm.dto.response.LeadMagnetResponse;
import com.arjun.crm.dto.response.SubmissionResponse;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.entity.LeadMagnet;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.LeadPriority;
import com.arjun.crm.enums.LeadStatus;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.LeadMagnetRepository;
import com.arjun.crm.repository.LeadRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.LeadMagnetService;
import com.arjun.crm.service.CacheEvictionService;
import com.arjun.crm.util.SlugGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * LeadMagnetServiceImpl - FEATURE #2 PHASE 1B
 * 
 * Implementation of authenticated lead magnet campaign management
 * 
 * Security:
 * - OWNER/ADMIN: Full CRUD
 * - MEMBER: Read-only (list, get)
 * - Workspace isolation enforced
 * - Slug uniqueness per workspace
 * - Authentication via WorkspaceAuthorizationService + SecurityContext
 * 
 * NOT implementing in Phase 1B:
 * - Public submission handling
 * - Analytics/reporting
 * - Rate limiting
 * - Feature #1 integration
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeadMagnetServiceImpl implements LeadMagnetService {
    
    private final LeadMagnetRepository magnetRepository;
    private final LeadRepository leadRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;
    private final CacheEvictionService cacheEvictionService;
    
    @Override
    public LeadMagnetResponse createMagnet(Long workspaceId, LeadMagnetCreateRequest request) {
        log.info("Creating lead magnet for workspace: {}", workspaceId);
        
        // Get authenticated user from SecurityContext
        User authenticatedUser = workspaceAuthService.getAuthenticatedUser();
        log.debug("Authenticated user: {}", authenticatedUser.getEmail());
        
        // Validate workspace exists
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Validate permission (OWNER/ADMIN only)
        // This uses authenticated user from SecurityContext, not client-supplied userId
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Generate or normalize slug
        String slug = generateUniqueSlug(workspaceId, request.getSlug(), request.getName());
        
        // Generate public token (globally unique UUID)
        String publicToken = UUID.randomUUID().toString();
        
        // Create magnet with authenticated user as creator
        LeadMagnet magnet = LeadMagnet.builder()
                .workspace(workspace)
                .name(request.getName())
                .description(request.getDescription())
                .slug(slug)
                .publicToken(publicToken)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .createdBy(authenticatedUser)
                .build();
        
        magnet = magnetRepository.save(magnet);
        log.info("Lead magnet created successfully: {} (publicToken: {})", magnet.getId(), publicToken);
        
        return mapToResponse(magnet);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<LeadMagnetResponse> listMagnets(Long workspaceId, Pageable pageable) {
        log.info("[TRACE-LeadMagnet-Service-START] workspaceId={}, page={}, size={}", 
                workspaceId, pageable.getPageNumber(), pageable.getPageSize());
        
        // Validate workspace access (any member can read)
        // Authenticated user from SecurityContext
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        log.info("[TRACE-LeadMagnet-Repository-CALLING] workspace_id={}", workspaceId);
        Page<LeadMagnet> magnets = magnetRepository.findByWorkspaceId(workspaceId, pageable);
        log.info("[TRACE-LeadMagnet-Repository-RESULT] total_elements={}, page_size={}, pages={}", 
                magnets.getTotalElements(), magnets.getSize(), magnets.getTotalPages());
        
        Page<LeadMagnetResponse> response = magnets.map(this::mapToResponse);
        log.info("[TRACE-LeadMagnet-Service-RESPONSE] mapped_elements={}", response.getTotalElements());
        
        return response;
    }
    
    @Override
    @Transactional(readOnly = true)
    public LeadMagnetResponse getMagnet(Long workspaceId, Long magnetId) {
        log.info("Getting lead magnet: {} from workspace: {}", magnetId, workspaceId);
        
        // Validate workspace access (any member can read)
        // Authenticated user from SecurityContext
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        // Workspace-scoped lookup (prevents cross-workspace access)
        LeadMagnet magnet = magnetRepository.findByIdAndWorkspaceId(magnetId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead magnet not found"));
        
        return mapToResponse(magnet);
    }
    
    @Override
    public LeadMagnetResponse updateMagnet(Long workspaceId, Long magnetId, LeadMagnetUpdateRequest request) {
        log.info("Updating lead magnet: {} in workspace: {}", magnetId, workspaceId);
        
        // Validate workspace access and permission
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Workspace-scoped lookup
        LeadMagnet magnet = magnetRepository.findByIdAndWorkspaceId(magnetId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead magnet not found"));
        
        // Update name
        if (request.getName() != null && !request.getName().isEmpty()) {
            magnet.setName(request.getName());
        }
        
        // Update description
        if (request.getDescription() != null) {
            magnet.setDescription(request.getDescription());
        }
        
        // Update slug (check uniqueness)
        if (request.getSlug() != null && !request.getSlug().isEmpty()) {
            String newSlug = SlugGenerator.generate(request.getSlug());
            
            // Check if slug already exists for a different magnet in this workspace
            if (!newSlug.equals(magnet.getSlug()) && 
                magnetRepository.existsByWorkspaceIdAndSlug(workspaceId, newSlug)) {
                throw new ConflictException("Slug '" + newSlug + "' is already in use");
            }
            
            magnet.setSlug(newSlug);
        }
        
        magnet = magnetRepository.save(magnet);
        log.info("Lead magnet updated successfully: {}", magnetId);
        
        return mapToResponse(magnet);
    }
    
    @Override
    public LeadMagnetResponse updateStatus(Long workspaceId, Long magnetId, boolean isActive) {
        log.info("Updating lead magnet status: {} to active={} in workspace: {}", 
                magnetId, isActive, workspaceId);
        
        // Validate workspace access and permission
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Workspace-scoped lookup
        LeadMagnet magnet = magnetRepository.findByIdAndWorkspaceId(magnetId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead magnet not found"));
        
        magnet.setIsActive(isActive);
        magnet = magnetRepository.save(magnet);
        
        log.info("Lead magnet status updated successfully: {} (active={})", magnetId, isActive);
        return mapToResponse(magnet);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isSlugAvailable(Long workspaceId, String slug, Long magnetId) {
        log.info("Checking slug availability in workspace: {} for slug: '{}'", workspaceId, slug);
        
        // Validate workspace access and permission
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Normalize the slug
        String normalizedSlug = SlugGenerator.generate(slug);
        
        if (!SlugGenerator.isValid(normalizedSlug)) {
            log.warn("Invalid slug format: '{}'", normalizedSlug);
            return false;
        }
        
        // Check if slug exists in workspace
        boolean exists = magnetRepository.existsByWorkspaceIdAndSlug(workspaceId, normalizedSlug);
        
        // If magnetId provided, exclude it from collision check (for updates)
        if (magnetId != null && exists) {
            LeadMagnet existingMagnet = magnetRepository.findByIdAndWorkspaceId(magnetId, workspaceId)
                    .orElse(null);
            
            if (existingMagnet != null && existingMagnet.getSlug().equals(normalizedSlug)) {
                // Same magnet has same slug - allowed for updates
                log.debug("Slug '{}' belongs to same magnet {} - available for update", normalizedSlug, magnetId);
                return true;
            }
        }
        
        boolean available = !exists;
        log.info("Slug '{}' availability in workspace {}: {}", normalizedSlug, workspaceId, available);
        return available;
    }
    
    @Override
    public SubmissionResponse submitPublicForm(LeadMagnet magnet, LeadMagnetSubmissionRequest request) {
        log.info("=== SUBMIT PUBLIC FORM ===");
        log.info("Magnet: id={}, workspace={}", magnet.getId(), magnet.getWorkspace().getId());
        log.info("Submission: name={}, email={}", request.getName(), request.getEmail());
        
        // Create Lead entity from submission
        Lead lead = Lead.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .company(request.getCompany())
                .status(LeadStatus.LEAD)  // Entry status for new leads
                .priority(LeadPriority.MEDIUM)  // Default priority
                .workspace(magnet.getWorkspace())
                .sourceMagnet(magnet)  // Link to the source magnet
                .createdBy(magnet.getCreatedBy())  // Use magnet creator
                .notes(request.getNotes())
                .build();
        
        // Save lead
        lead = leadRepository.save(lead);
        log.info("✅ Lead created successfully: id={}, email={}", lead.getId(), lead.getEmail());
        
        // Evict dashboard cache to ensure fresh data is shown
        cacheEvictionService.evictDashboardCache();
        log.debug("Dashboard cache evicted after new lead submission");
        
        // Build and return response
        SubmissionResponse response = SubmissionResponse.builder()
                .leadId(lead.getId())
                .name(lead.getName())
                .email(lead.getEmail())
                .phone(lead.getPhone())
                .company(lead.getCompany())
                .status(lead.getStatus().toString())
                .magnetName(magnet.getName())
                .submittedAt(LocalDateTime.now())
                .thankYouMessage("Thank you for your interest! Our team will follow up soon.")
                .build();
        
        log.info("✅ Submission response created: {}", response.getLeadId());
        return response;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Generate a unique slug for the campaign
     * 
     * If slug not provided, generates from name.
     * If collision occurs, appends -2, -3, etc.
     * 
     * @param workspaceId the workspace ID
     * @param providedSlug the optional provided slug
     * @param name the campaign name
     * @return unique slug
     */
    private String generateUniqueSlug(Long workspaceId, String providedSlug, String name) {
        String baseSlug;
        
        if (providedSlug != null && !providedSlug.trim().isEmpty()) {
            // Use provided slug
            baseSlug = SlugGenerator.generate(providedSlug);
        } else {
            // Generate from name
            baseSlug = SlugGenerator.generate(name);
        }
        
        // Check uniqueness and resolve collision
        String slug = baseSlug;
        int attempt = 2;
        
        while (magnetRepository.existsByWorkspaceIdAndSlug(workspaceId, slug)) {
            log.debug("Slug collision detected: '{}', trying attempt: {}", slug, attempt);
            slug = SlugGenerator.withCollisionResolution(baseSlug, attempt);
            attempt++;
        }
        
        if (!slug.equals(baseSlug)) {
            log.info("Slug collision resolved: '{}' → '{}'", baseSlug, slug);
        }
        
        return slug;
    }
    
    /**
     * Map LeadMagnet entity to response DTO
     * 
     * @param magnet the entity
     * @return response DTO with computed publicPath
     */
    private LeadMagnetResponse mapToResponse(LeadMagnet magnet) {
        String publicPath = "/m/" + magnet.getPublicToken() + "/" + magnet.getSlug();
        
        return LeadMagnetResponse.builder()
                .id(magnet.getId())
                .workspaceId(magnet.getWorkspace().getId())
                .name(magnet.getName())
                .description(magnet.getDescription())
                .slug(magnet.getSlug())
                .publicToken(magnet.getPublicToken())
                .publicPath(publicPath)
                .isActive(magnet.getIsActive())
                .createdById(magnet.getCreatedBy().getId())
                .createdAt(magnet.getCreatedAt())
                .updatedAt(magnet.getUpdatedAt())
                .build();
    }
}
