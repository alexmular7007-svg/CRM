package com.arjun.crm.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AddRecipientsRequest - FEATURE #3
 * 
 * Request DTO for adding recipients to a campaign
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddRecipientsRequest {
    
    private Long segmentId;  // optional, add from segment
    
    private RecipientData[] recipients;  // optional, manual list
    
    @Builder.Default
    private Boolean replaceExisting = false;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecipientData {
        @NotEmpty(message = "Email is required")
        private String email;
        
        private String name;
        
        private String company;
        
        private String variables;  // JSON
    }
}
