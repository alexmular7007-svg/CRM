package com.arjun.crm.dto.request;

import com.arjun.crm.enums.ChromeExtensionStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateChromeExtensionRequest {

    @Size(max = 255, message = "Extension name cannot exceed 255 characters")
    private String name;

    private String description;

    private String version;

    private ChromeExtensionStatus status;

    private Map<String, Object> manifestJson;
}
