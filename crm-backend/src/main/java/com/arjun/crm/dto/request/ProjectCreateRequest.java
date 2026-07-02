package com.arjun.crm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectCreateRequest {

    @NotBlank(message = "Project name is required")
    @Size(min = 2, max = 100, message = "Project name must be between 2 and 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Workspace ID is required")
    private Long workspaceId;
    
    // Color field - optional, defaults to blue
    @Size(max = 7, message = "Color must be a valid hex code (e.g., #3b82f6)")
    private String color;
    
    // Status field - optional, defaults to PLANNING
    private String status;
    
    // Dates - optional
    private LocalDate startDate;
    private LocalDate endDate;
}
