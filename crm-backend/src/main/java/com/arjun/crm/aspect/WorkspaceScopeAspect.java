package com.arjun.crm.aspect;

import com.arjun.crm.annotation.WorkspaceScoped;
import com.arjun.crm.entity.User;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.repository.WorkspaceMemberRepository;
import com.arjun.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;

/**
 * Workspace Scope Aspect
 * 
 * Validates that the current user is a member of the workspace
 * being accessed in @WorkspaceScoped endpoints
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class WorkspaceScopeAspect {

    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;

    @Around("@annotation(workspaceScoped)")
    public Object validateWorkspaceScope(ProceedingJoinPoint joinPoint, WorkspaceScoped workspaceScoped)
            throws Throwable {

        // Get current user
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new AccessDeniedException("User not authenticated");
        }

        // Extract workspace ID from method arguments
        Long workspaceId = extractWorkspaceId(joinPoint, workspaceScoped.value());
        if (workspaceId == null) {
            log.warn("⚠️ Could not extract workspaceId from method arguments");
            throw new AccessDeniedException("Workspace ID not provided");
        }

        // Check if user is owner or member of workspace
        boolean isOwner = checkIsOwner(currentUser, workspaceId);
        boolean isMember = checkIsMember(currentUser, workspaceId);

        if (!isOwner && !isMember) {
            log.warn("❌ Access denied: User {} attempted to access workspace {} without membership",
                    currentUser.getEmail(), workspaceId);
            throw new AccessDeniedException("You don't have access to this workspace");
        }

        log.debug("✓ Workspace isolation verified: user={}, workspace={}, role={}", 
                currentUser.getEmail(), workspaceId, isOwner ? "OWNER" : "MEMBER");

        // Proceed with method execution
        return joinPoint.proceed();
    }

    /**
     * Extract workspace ID from method arguments
     */
    private Long extractWorkspaceId(ProceedingJoinPoint joinPoint, String paramName) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Parameter[] parameters = method.getParameters();
        Object[] args = joinPoint.getArgs();

        // Try to find @PathVariable with the parameter name
        for (int i = 0; i < parameters.length; i++) {
            Parameter param = parameters[i];
            
            // Check @PathVariable
            PathVariable pathVar = param.getAnnotation(PathVariable.class);
            if (pathVar != null) {
                String varName = pathVar.value().isEmpty() ? param.getName() : pathVar.value();
                if (varName.equals(paramName) && args[i] instanceof Long) {
                    return (Long) args[i];
                }
            }

            // Check @RequestParam
            RequestParam requestParam = param.getAnnotation(RequestParam.class);
            if (requestParam != null) {
                String paramNameFromAnnotation = requestParam.value().isEmpty() ? param.getName() : requestParam.value();
                if (paramNameFromAnnotation.equals(paramName) && args[i] instanceof Long) {
                    return (Long) args[i];
                }
            }

            // Check if parameter name matches and value is Long
            if (param.getName().equals(paramName) && args[i] instanceof Long) {
                return (Long) args[i];
            }
        }

        return null;
    }

    /**
     * Check if user is workspace owner
     */
    private boolean checkIsOwner(User user, Long workspaceId) {
        return workspaceMemberRepository.existsByWorkspaceIdAndUserIdAndRole(
                workspaceId, user.getId(), com.arjun.crm.enums.WorkspaceRole.OWNER);
    }

    /**
     * Check if user is workspace member (not deleted)
     */
    private boolean checkIsMember(User user, Long workspaceId) {
        return workspaceMemberRepository.existsByWorkspaceIdAndUserIdAndDeletedAtIsNull(
                workspaceId, user.getId());
    }

    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetails)) {
            return null;
        }

        String email = ((UserDetails) principal).getUsername();
        return userRepository.findByEmail(email).orElse(null);
    }
}
