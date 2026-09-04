package com.arjun.crm.dto.response;

import com.arjun.crm.enums.ChromeExtensionStatus;
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
public class ChromeExtensionResponse {

    private Long id;
    private Long workspaceId;
    private String name;
    private String description;
    private String version;
    private ChromeExtensionStatus status;
    private Map<String, Object> manifestJson;
    private Long createdById;
    private String createdByName;
    private long testCaseCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
