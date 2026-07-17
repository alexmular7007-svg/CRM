package com.arjun.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves uploaded chat files.
 * URL: GET /api/chat/files/{filename}
 *
 * No authentication required for download — the URL itself is the secret
 * (UUID-prefixed filename). Add auth here if stronger security is needed.
 */
@RestController
@RequestMapping("/api/chat/files")
@Slf4j
public class ChatFileController {

    @Value("${file.upload.dir:uploads/task-attachments}")
    private String taskUploadDir;

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            // Chat files are stored in <uploadDir>/../chat-files/
            Path chatDir = Paths.get(taskUploadDir)
                    .normalize()
                    .resolveSibling("chat-files");

            Path filePath = chatDir.resolve(filename).normalize();

            // Safety: prevent path traversal
            if (!filePath.startsWith(chatDir)) {
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                log.warn("Chat file not found: {}", filename);
                return ResponseEntity.notFound().build();
            }

            // Determine content type from extension
            String contentType = determineContentType(filename);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            log.error("Malformed URL for file: {}", filename, e);
            return ResponseEntity.badRequest().build();
        }
    }

    private String determineContentType(String filename) {
        String lower = filename.toLowerCase();
        // Documents
        if (lower.endsWith(".pdf"))  return "application/pdf";
        if (lower.endsWith(".txt"))  return "text/plain";
        if (lower.endsWith(".md"))   return "text/markdown";
        if (lower.endsWith(".csv"))  return "text/csv";
        if (lower.endsWith(".doc"))  return "application/msword";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".xls"))  return "application/vnd.ms-excel";
        if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (lower.endsWith(".ppt"))  return "application/vnd.ms-powerpoint";
        if (lower.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        // Images
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif"))  return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".svg"))  return "image/svg+xml";
        // Video
        if (lower.endsWith(".mp4"))  return "video/mp4";
        if (lower.endsWith(".mov"))  return "video/quicktime";
        if (lower.endsWith(".avi"))  return "video/x-msvideo";
        if (lower.endsWith(".webm")) return "video/webm";
        // Audio
        if (lower.endsWith(".mp3"))  return "audio/mpeg";
        if (lower.endsWith(".wav"))  return "audio/wav";
        if (lower.endsWith(".ogg"))  return "audio/ogg";
        if (lower.endsWith(".zip"))  return "application/zip";
        return "application/octet-stream";
    }
}
