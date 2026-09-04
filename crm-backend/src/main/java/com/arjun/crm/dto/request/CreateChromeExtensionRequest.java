package com.arjun.crm.dto.request;

import com.arjun.crm.enums.ChromeExtensionStatus;
import jakarta.validation.constraints.NotBlank;
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
public class CreateChromeExtensionRequest {

    @NotBlank(message = "Extension name is required")
    @Size(max = 255, message = "Extension name cannot exceed 255 characters")
    private String name;

    private String description;

    @Builder.Default
    private String version = "1.0.0";

    @Builder.Default
    private ChromeExtensionStatus status = ChromeExtensionStatus.ACTIVE;

    private Map<String, Object> manifestJson;
}
