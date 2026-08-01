package com.arjun.crm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CreateEmailSegmentRequest - FEATURE #3
 * 
 * Request DTO for creating an email campaign segment (audience filter)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEmailSegmentRequest {
    
    @NotBlank(message = "Segment name is required")
    @Size(min = 1, max = 255, message = "Segment name must be between 1 and 255 characters")
    private String name;
    
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
    
    @NotBlank(message = "Filter criteria is required")
    private String filterCriteria;  // JSON filter definition
}
