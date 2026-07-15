package com.arjun.crm.event;

import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * ENTERPRISE NOTIFICATION CENTER
 * Event published when a member is removed from a workspace
 */
@Getter
public class MemberRemovedEvent extends ApplicationEvent {

    private final User removedUser;
    private final Workspace workspace;
    private final User removedBy;

    public MemberRemovedEvent(Object source, User removedUser, Workspace workspace, User removedBy) {
        super(source);
        this.removedUser = removedUser;
        this.workspace = workspace;
        this.removedBy = removedBy;
    }
}
