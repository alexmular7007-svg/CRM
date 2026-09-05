package com.arjun.crm.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTestSuiteRequest {

    @NotBlank(message = "Suite name is required")
    @Size(max = 255, message = "Suite name cannot exceed 255 characters")
    private String name;

    private String description;

    @Builder.Default
    private Boolean stopOnFailure = false;

    @Builder.Default
    private Boolean enabled = true;

    @Valid
    private List<TestSuiteItemRequest> items;
}
