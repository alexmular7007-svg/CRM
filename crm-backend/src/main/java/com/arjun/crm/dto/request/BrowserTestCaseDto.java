package com.arjun.crm.dto.request;

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
public class BrowserTestCaseDto {
    private String type; // POPUP_SMOKE, CONTENT_SCRIPT_SMOKE, STORAGE_SMOKE, BROWSER
    private String name;
    private List<Map<String, Object>> steps;
}
