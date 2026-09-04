package com.arjun.crm.dto.request;

import com.arjun.crm.enums.TestCaseType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTestCaseRequest {

    @NotBlank(message = "Test case name is required")
    @Size(max = 255, message = "Test case name cannot exceed 255 characters")
    private String name;

    private String description;

    @NotNull(message = "Test type is required")
    private TestCaseType testType;

    private Map<String, Object> configuration;

    private Map<String, Object> expectedResult;

    @Builder.Default
    private Boolean enabled = true;

    @Builder.Default
    private Integer displayOrder = 0;
}
