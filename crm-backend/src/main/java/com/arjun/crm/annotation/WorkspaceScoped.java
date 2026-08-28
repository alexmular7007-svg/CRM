package com.arjun.crm.annotation;

import java.lang.annotation.*;

/**
 * Workspace-scoped endpoint annotation
 * 
 * Ensures current user is a member of the workspace being accessed.
 * The workspace ID must be extracted from:
 * 1. @PathVariable("workspaceId")
 * 2. @RequestParam("workspaceId")
 * 3. Request body field "workspaceId"
 * 
 * Usage:
 * @WorkspaceScoped
 * @GetMapping("/{workspaceId}/tasks")
 * public ResponseEntity<...> getTasks(@PathVariable Long workspaceId) { }
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface WorkspaceScoped {
    
    /**
     * Name of path variable or request param containing workspace ID
     * Default: "workspaceId"
     */
    String value() default "workspaceId";
    
    /**
     * Optional description
     */
    String description() default "";
}
