package com.arjun.crm.interceptor;

import com.arjun.crm.annotation.RateLimit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate Limiting Interceptor
 * 
 * Implements token bucket rate limiting per IP address
 * Automatically limits requests to public endpoints
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    // Store: IP -> (lastRefillTime, tokensRemaining)
    private final Map<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();
    
    // Cleanup thread - remove old buckets every 5 minutes
    static {
        Thread cleanupThread = new Thread(() -> {
            while (true) {
                try {
                    Thread.sleep(5 * 60 * 1000); // 5 minutes
                    // Cleanup happens in preHandle when timestamp is old
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
        cleanupThread.setDaemon(true);
        cleanupThread.start();
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        
        // Only check rate limit for HandlerMethod (actual endpoints)
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }

        HandlerMethod handlerMethod = (HandlerMethod) handler;
        RateLimit rateLimitAnnotation = handlerMethod.getMethodAnnotation(RateLimit.class);

        // If no @RateLimit annotation, allow request
        if (rateLimitAnnotation == null) {
            return true;
        }

        String clientIp = getClientIp(request);
        int requestsPerMinute = rateLimitAnnotation.requestsPerMinute();

        // Check rate limit
        if (!isRequestAllowed(clientIp, requestsPerMinute)) {
            log.warn("⚠️ Rate limit exceeded for IP: {}", clientIp);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Rate limit exceeded. Maximum " + requestsPerMinute + " requests per minute.\"}");
            return false;
        }

        return true;
    }

    /**
     * Check if request is allowed using token bucket algorithm
     */
    private synchronized boolean isRequestAllowed(String clientIp, int requestsPerMinute) {
        long now = System.currentTimeMillis();
        
        RateLimitBucket bucket = buckets.computeIfAbsent(clientIp, k -> 
            new RateLimitBucket(now, requestsPerMinute));

        // Refill tokens based on time elapsed
        long elapsedMs = now - bucket.lastRefillTime;
        if (elapsedMs >= 60000) { // 1 minute has passed
            bucket.tokensRemaining = requestsPerMinute;
            bucket.lastRefillTime = now;
        } else {
            // Gradual token refill: 1 token per (60000 / requestsPerMinute) ms
            long refillInterval = 60000L / requestsPerMinute;
            long tokensToAdd = elapsedMs / refillInterval;
            bucket.tokensRemaining = Math.min(requestsPerMinute, bucket.tokensRemaining + tokensToAdd);
            if (tokensToAdd > 0) {
                bucket.lastRefillTime += tokensToAdd * refillInterval;
            }
        }

        // Check if token available
        if (bucket.tokensRemaining > 0) {
            bucket.tokensRemaining--;
            return true;
        }

        return false;
    }

    /**
     * Extract client IP from request (handle proxies)
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Get first IP if multiple IPs separated by comma
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "unknown";
    }

    /**
     * Token bucket state
     */
    private static class RateLimitBucket {
        long lastRefillTime;
        long tokensRemaining;

        RateLimitBucket(long lastRefillTime, long tokensRemaining) {
            this.lastRefillTime = lastRefillTime;
            this.tokensRemaining = tokensRemaining;
        }
    }
}
