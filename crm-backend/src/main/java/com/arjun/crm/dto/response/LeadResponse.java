package com.arjun.crm.dto.response;

import com.arjun.crm.enums.LeadPriority;
import com.arjun.crm.enums.LeadStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadResponse {
    
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String company;
    private String position;
    private BigDecimal dealValue;
    private LeadStatus status;
    private LeadPriority priority;
    private UserSummary assignedTo;
    private Long workspaceId;
    private List<String> tags;
    private String notes;
    private LocalDate expectedCloseDate;
    private LocalDateTime lastActivityAt;
    private UserSummary createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Feature #1: Lead → Client → Project Conversion
    private Boolean converted;
    private LocalDateTime convertedAt;
    private Long convertedProjectId;
    private Long convertedClientId;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;
        private String fullName;
        private String email;
    }
}
