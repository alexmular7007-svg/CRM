package com.arjun.crm.dto.response;

import com.arjun.crm.enums.TestCaseType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TestCaseResponse {

    private Long id;
    private Long extensionId;
    private String name;
    private String description;
    private TestCaseType testType;
    private Map<String, Object> configuration;
    private Map<String, Object> expectedResult;
    private Boolean enabled;
    private Integer displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
