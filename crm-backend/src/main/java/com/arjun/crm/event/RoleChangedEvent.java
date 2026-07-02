package com.arjun.crm.event;

import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * ENTERPRISE NOTIFICATION CENTER
 * Event published when a user's workspace role changes
 */
@Getter
public class RoleChangedEvent extends ApplicationEvent {
    
    private final User user;
    private final Workspace workspace;
    private final String oldRole;
    private final String newRole;
    private final User changedBy;

    public RoleChangedEvent(Object source, User user, Workspace workspace, 
                           String oldRole, String newRole, User changedBy) {
        super(source);
        this.user = user;
        this.workspace = workspace;
        this.oldRole = oldRole;
        this.newRole = newRole;
        this.changedBy = changedBy;
    }
}
