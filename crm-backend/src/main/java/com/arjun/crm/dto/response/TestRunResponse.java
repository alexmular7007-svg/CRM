package com.arjun.crm.dto.response;

import com.arjun.crm.enums.TestRunStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TestRunResponse {

    private Long id;
    private Long workspaceId;
    private Long extensionId;
    private String extensionName;
    private Long triggeredById;
    private String triggeredByName;
    private Long suiteId;
    private String suiteName;
    private TestRunStatus status;
    private String environment;
    private Integer totalTests;
    private Integer passedTests;
    private Integer failedTests;
    private Integer errorTests;
    private Integer skippedTests;
    private Long durationMs;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String logs;
    private List<TestResultResponse> results;
    private LocalDateTime createdAt;
}
