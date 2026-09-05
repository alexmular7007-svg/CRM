package com.arjun.crm.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestSuiteItemRequest {

    @NotNull(message = "testCaseId is required")
    private Long testCaseId;

    private Integer executionOrder;

    @Builder.Default
    private Boolean enabled = true;
}
