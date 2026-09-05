package com.arjun.crm.dto.response;

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
public class TestSuiteResponse {

    private Long id;
    private Long workspaceId;
    private Long extensionId;
    private String extensionName;
    private String name;
    private String description;
    private Boolean stopOnFailure;
    private Boolean enabled;
    private Long createdById;
    private String createdByName;
    private Integer totalItems;
    private List<TestSuiteItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
