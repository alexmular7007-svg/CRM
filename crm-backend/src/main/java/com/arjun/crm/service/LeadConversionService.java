package com.arjun.crm.service;

import com.arjun.crm.dto.request.LeadConversionRequest;
import com.arjun.crm.dto.response.LeadConversionResponse;

/**
 * Service for converting WON leads to projects with clients
 */
public interface LeadConversionService {
    
    /**
     * Convert a WON lead to a project with client
     * 
     * @param leadId The lead to convert (must exist and be WON)
     * @param request Conversion configuration
     * @return Conversion response with created entities
     * @throws ResourceNotFoundException if lead not found
     * @throws AccessDeniedException if user lacks permission
     * @throws IllegalStateException if lead is not WON
     * @throws ConflictException if lead already converted
     * @throws IllegalArgumentException if invalid members/manager
     */
    LeadConversionResponse convertLeadToProject(Long leadId, LeadConversionRequest request);
}
