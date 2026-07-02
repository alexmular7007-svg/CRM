package com.arjun.crm.controller;

import com.arjun.crm.dto.request.CreateLeadRequest;
import com.arjun.crm.dto.request.UpdateLeadRequest;
import com.arjun.crm.dto.request.UpdateLeadStatusRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.LeadActivityResponse;
import com.arjun.crm.dto.response.LeadAnalyticsResponse;
import com.arjun.crm.dto.response.LeadResponse;
import com.arjun.crm.enums.LeadStatus;
import com.arjun.crm.security.JwtService;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.LeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
@Tag(name = "Lead Management", description = "CRM Lead/Pipeline Management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class LeadController {
    
    private final LeadService leadService;
    private final JwtService jwtService;
    private final WorkspaceAuthorizationService workspaceAuthService;
    
    @PostMapping
    @Operation(summary = "Create a new lead", description = "Create a new lead in the CRM pipeline")
    public ResponseEntity<ApiResponse<LeadResponse>> createLead(
            @Valid @RequestBody CreateLeadRequest request,
            @RequestHeader("Authorization") String token) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(request.getWorkspaceId());
        
        Long userId = jwtService.extractUserId(token.substring(7));
        LeadResponse lead = leadService.createLead(request, userId);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Lead created successfully", lead));
    }
    
    @PutMapping("/{leadId}")
    @Operation(summary = "Update lead", description = "Update lead details")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLead(
            @PathVariable Long leadId,
            @Valid @RequestBody UpdateLeadRequest request,
            @RequestHeader("Authorization") String token) {
        
        Long userId = jwtService.extractUserId(token.substring(7));
        LeadResponse lead = leadService.updateLead(leadId, request, userId);
        
        return ResponseEntity.ok(ApiResponse.success("Lead updated successfully", lead));
    }
    
    @PatchMapping("/{leadId}/status")
    @Operation(summary = "Update lead status", description = "Move lead to different pipeline stage")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLeadStatus(
            @PathVariable Long leadId,
            @Valid @RequestBody UpdateLeadStatusRequest request,
            @RequestHeader("Authorization") String token) {
        
        Long userId = jwtService.extractUserId(token.substring(7));
        LeadResponse lead = leadService.updateLeadStatus(leadId, request, userId);
        
        return ResponseEntity.ok(ApiResponse.success("Lead status updated successfully", lead));
    }
    
    @GetMapping("/{leadId}")
    @Operation(summary = "Get lead by ID", description = "Retrieve lead details by ID")
    public ResponseEntity<ApiResponse<LeadResponse>> getLeadById(
            @PathVariable Long leadId,
            @RequestHeader("Authorization") String token) {
        
        Long userId = jwtService.extractUserId(token.substring(7));
        LeadResponse lead = leadService.getLeadById(leadId, userId);
        
        return ResponseEntity.ok(ApiResponse.success("Lead retrieved successfully", lead));
    }
    
    @GetMapping("/workspace/{workspaceId}")
    @Operation(summary = "Get leads by workspace", description = "Retrieve all leads in a workspace")
    public ResponseEntity<ApiResponse<Page<LeadResponse>>> getLeadsByWorkspace(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @RequestHeader("Authorization") String token) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        Long userId = jwtService.extractUserId(token.substring(7));
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<LeadResponse> leads = leadService.getLeadsByWorkspace(workspaceId, userId, pageable);
        
        return ResponseEntity.ok(ApiResponse.success("Leads retrieved successfully", leads));
    }
    
    @GetMapping("/workspace/{workspaceId}/filter")
    @Operation(summary = "Filter leads", description = "Filter leads by status, assignee, priority, and search")
    public ResponseEntity<ApiResponse<Page<LeadResponse>>> filterLeads(
            @PathVariable Long workspaceId,
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @RequestHeader("Authorization") String token) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        Long userId = jwtService.extractUserId(token.substring(7));
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<LeadResponse> leads = leadService.getLeadsByFilters(
                workspaceId, status, assignedToId, priority, search, userId, pageable);
        
        return ResponseEntity.ok(ApiResponse.success("Leads filtered successfully", leads));
    }
    
    @DeleteMapping("/{leadId}")
    @Operation(summary = "Delete lead", description = "Delete a lead from the system")
    public ResponseEntity<ApiResponse<Void>> deleteLead(
            @PathVariable Long leadId,
            @RequestHeader("Authorization") String token) {
        
        Long userId = jwtService.extractUserId(token.substring(7));
        leadService.deleteLead(leadId, userId);
        
        return ResponseEntity.ok(ApiResponse.success("Lead deleted successfully", null));
    }
    
    @GetMapping("/{leadId}/activities")
    @Operation(summary = "Get lead activities", description = "Retrieve activity timeline for a lead")
    public ResponseEntity<ApiResponse<List<LeadActivityResponse>>> getLeadActivities(
            @PathVariable Long leadId,
            @RequestHeader("Authorization") String token) {
        
        Long userId = jwtService.extractUserId(token.substring(7));
        List<LeadActivityResponse> activities = leadService.getLeadActivities(leadId, userId);
        
        return ResponseEntity.ok(ApiResponse.success("Activities retrieved successfully", activities));
    }
    
    @GetMapping("/workspace/{workspaceId}/analytics")
    @Operation(summary = "Get lead analytics", description = "Retrieve pipeline analytics and metrics")
    public ResponseEntity<ApiResponse<LeadAnalyticsResponse>> getLeadAnalytics(
            @PathVariable Long workspaceId,
            @RequestHeader("Authorization") String token) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        Long userId = jwtService.extractUserId(token.substring(7));
        LeadAnalyticsResponse analytics = leadService.getLeadAnalytics(workspaceId, userId);
        
        return ResponseEntity.ok(ApiResponse.success("Analytics retrieved successfully", analytics));
    }
}
