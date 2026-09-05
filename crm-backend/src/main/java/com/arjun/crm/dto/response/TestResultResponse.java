package com.arjun.crm.dto.response;

import com.arjun.crm.enums.TestResultStatus;
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
public class TestResultResponse {

    private Long id;
    private Long testRunId;
    private Long testCaseId;
    private String testCaseName;
    private TestResultStatus status;
    private Integer executionTimeMs;
    private Integer actualStatusCode;
    private Map<String, Object> actualResponsePayload;
    private String errorMessage;
    private Map<String, Object> assertionDetails;
    private String requestMethod;
    private String requestUrl;
    private LocalDateTime createdAt;
}
