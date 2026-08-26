package com.arjun.crm.config;

import com.arjun.crm.interceptor.RateLimitInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Serves uploaded files (task attachments, chat files) as static resources.
 *
 * URL pattern  : /api/uploads/**
 * Physical path: ${file.upload.dir}  (default: /tmp/uploads inside Docker)
 *
 * Both the task-attachment subdirectory and the chat subdirectory are served
 * because they both live under the same root upload dir.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload.dir:/tmp/uploads}")
    private String uploadDir;
    
    private final RateLimitInterceptor rateLimitInterceptor;
    
    public WebMvcConfig(RateLimitInterceptor rateLimitInterceptor) {
        this.rateLimitInterceptor = rateLimitInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Resolve to absolute path — works regardless of working directory
        String absolutePath = Paths.get(uploadDir).toAbsolutePath().normalize().toString();
        // Ensure it ends with /
        if (!absolutePath.endsWith("/")) absolutePath += "/";

        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations("file:" + absolutePath);
    }
}
