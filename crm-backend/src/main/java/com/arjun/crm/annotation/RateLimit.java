package com.arjun.crm.annotation;

import java.lang.annotation.*;

/**
 * Rate limiting annotation for endpoints
 * 
 * Usage:
 * @RateLimit(requestsPerMinute = 100)
 * public ResponseEntity<...> myEndpoint() { }
 * 
 * Limits requests from a single IP address
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimit {
    
    /**
     * Maximum requests allowed per minute per IP address
     */
    int requestsPerMinute() default 100;
    
    /**
     * Optional description of rate limit
     */
    String description() default "";
}
