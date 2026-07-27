package com.arjun.crm.controller;

import com.arjun.crm.dto.request.LeadConversionRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.LeadConversionResponse;
import com.arjun.crm.service.LeadConversionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for lead-to-project conversion operations
 * 
 * Endpoint: POST /api/leads/{leadId}/convert-to-project
 * Converts a WON lead to a project with client
 */
@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
@Slf4j
public class LeadConversionController {
    
    private final LeadConversionService conversionService;
    
    /**
     * Convert a WON lead to a project
     * 
     * POST /api/leads/{leadId}/convert-to-project
     * 
     * @param leadId The lead to convert
     * @param request Conversion configuration
     * @return LeadConversionResponse with created entities
     * 
     * Authorization: Authenticated user must be member of the lead's workspace
     * 
     * Errors:
     * - 401: User not authenticated
     * - 403: User lacks workspace access
     * - 404: Lead not found
     * - 409: Lead already converted
     * - 422: Lead not WON, or invalid members/manager
     */
    @PostMapping("/{leadId}/convert-to-project")
    public ResponseEntity<ApiResponse<LeadConversionResponse>> convertLeadToProject(
            @PathVariable Long leadId,
            @Valid @RequestBody LeadConversionRequest request) {
        
        log.info("Lead conversion request received for lead ID: {}", leadId);
        
        LeadConversionResponse response = conversionService.convertLeadToProject(leadId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Lead successfully converted to project", response));
    }
}
