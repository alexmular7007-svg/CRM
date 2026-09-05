package com.arjun.crm.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrowserTestRunRequest {
    private Long runId;
    private String extensionPath;
    private List<BrowserTestCaseDto> testCases;
}
