package com.arjun.crm.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Supabase Configuration Properties
 *
 * Maps to application.yml properties:
 * supabase:
 *   url: ...
 *   anon-key: ...
 *   service-key: ...
 *   storage:
 *     bucket-name: ...
 *     chat-folder: ...
 *     task-folder: ...
 *     max-file-size: ...
 *     signed-url-expiry: ...
 *     is-public: ...
 */
@Component
@ConfigurationProperties(prefix = "supabase")
@Data
public class SupabaseConfig {

    private String url;
    private String anonKey;
    private String serviceKey;
    private StorageConfig storage = new StorageConfig();

    @Data
    public static class StorageConfig {
        private String bucketName = "chat-attachments";
        private String chatFolder = "chat";
        private String taskFolder = "tasks";
        private Long maxFileSize = 20_971_520L;  // 20 MB
        private Integer signedUrlExpiry = 604_800;  // 7 days
        private Boolean isPublic = false;
    }
}
