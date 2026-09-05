package com.arjun.crm.dto.response;

import com.arjun.crm.enums.TestCaseType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TestSuiteItemResponse {

    private Long id;
    private Long suiteId;
    private Long testCaseId;
    private String testCaseName;
    private TestCaseType testCaseType;
    private Integer executionOrder;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
