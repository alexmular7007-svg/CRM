package com.arjun.crm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrowserTestRunResponse {
    private Long runId;
    private String status;
    private String startedAt;
    private String completedAt;
    private Long durationMs;
    private Integer totalTests;
    private Integer passedTests;
    private Integer failedTests;
    private Integer errorTests;
    private List<Map<String, Object>> results;
    private List<String> logs;
    private String message;
}
