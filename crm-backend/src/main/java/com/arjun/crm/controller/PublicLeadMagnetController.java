package com.arjun.crm.controller;

import com.arjun.crm.dto.request.LeadMagnetSubmissionRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.LeadMagnetResponse;
import com.arjun.crm.dto.response.SubmissionResponse;
import com.arjun.crm.entity.LeadMagnet;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.LeadMagnetRepository;
import com.arjun.crm.service.LeadMagnetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * PUBLIC API for Lead Magnet Forms (No Authentication Required)
 *
 * Endpoints:
 * - GET /api/public/lead-magnets/{publicToken} - Get campaign details for public form
 * - POST /api/public/lead-magnets/{publicToken}/submit - Submit form and create lead
 *
 * Security:
 * - publicToken is a UUID that's difficult to guess
 * - Only returns ACTIVE campaigns
 * - Submission creates a Lead (visitor doesn't need account)
 * - No direct access to admin data
 */
@Slf4j
@RestController
@RequestMapping("/api/public/lead-magnets")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PublicLeadMagnetController {

    private final LeadMagnetRepository leadMagnetRepository;
    private final LeadMagnetService leadMagnetService;

    /**
     * GET /api/public/lead-magnets/{publicToken}
     * Get public campaign details for rendering the form
     * NO AUTHENTICATION REQUIRED
     */
    @GetMapping("/{publicToken}")
    public ResponseEntity<ApiResponse<LeadMagnetResponse>> getPublicCampaign(
            @PathVariable String publicToken) {
        
        log.info("=== GET Public Lead Magnet ===");
        log.info("Public Token: {}", publicToken);

        // Find magnet by public token (only if ACTIVE)
        LeadMagnet magnet = leadMagnetRepository
                .findByPublicTokenAndIsActiveTrue(publicToken)
                .orElseThrow(() -> {
                    log.error("❌ Campaign not found for token: {}", publicToken);
                    return new ResourceNotFoundException("Campaign not found or has been deleted");
                });

        log.info("✅ Found campaign: id={}, name={}, workspace={}", 
                magnet.getId(), magnet.getName(), magnet.getWorkspace().getId());

        // Convert to response
        LeadMagnetResponse response = LeadMagnetResponse.builder()
                .id(magnet.getId())
                .workspaceId(magnet.getWorkspace().getId())
                .name(magnet.getName())
                .description(magnet.getDescription())
                .slug(magnet.getSlug())
                .publicToken(magnet.getPublicToken())
                .publicPath("/m/" + magnet.getPublicToken() + "/" + magnet.getSlug())
                .isActive(magnet.getIsActive())
                .createdById(magnet.getCreatedBy().getId())
                .createdAt(magnet.getCreatedAt())
                .updatedAt(magnet.getUpdatedAt())
                .build();
        
        return ResponseEntity.ok(ApiResponse.success("Campaign found", response));
    }

    /**
     * POST /api/public/lead-magnets/{publicToken}/submit
     * Submit the public form and create a Lead
     * NO AUTHENTICATION REQUIRED
     */
    @PostMapping("/{publicToken}/submit")
    public ResponseEntity<ApiResponse<SubmissionResponse>> submitPublicForm(
            @PathVariable String publicToken,
            @Valid @RequestBody LeadMagnetSubmissionRequest request) {
        
        log.info("=== POST Public Lead Magnet Submit ===");
        log.info("Public Token: {}", publicToken);
        log.info("Submission: name={}, email={}, phone={}, company={}", 
                request.getName(), request.getEmail(), request.getPhone(), request.getCompany());

        // Find magnet (only if ACTIVE)
        LeadMagnet magnet = leadMagnetRepository
                .findByPublicTokenAndIsActiveTrue(publicToken)
                .orElseThrow(() -> {
                    log.error("❌ Campaign not found or inactive for token: {}", publicToken);
                    return new ResourceNotFoundException("Campaign not found or has been deleted");
                });

        log.info("✅ Found campaign: id={}, workspace={}", magnet.getId(), magnet.getWorkspace().getId());

        // Submit form (service handles creating Lead and incrementing submissions)
        SubmissionResponse response = leadMagnetService.submitPublicForm(magnet, request);
        
        log.info("✅ Form submitted successfully for campaign: {}", magnet.getId());
        
        return ResponseEntity.ok(ApiResponse.success("Form submitted successfully", response));
    }
}
