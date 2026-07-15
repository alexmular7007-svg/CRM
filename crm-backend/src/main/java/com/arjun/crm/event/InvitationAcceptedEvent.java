package com.arjun.crm.event;

import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class InvitationAcceptedEvent extends ApplicationEvent {
    
    private final WorkspaceMember member;
    private final Workspace workspace;
    private final User acceptedBy;
    private final User invitedBy;

    public InvitationAcceptedEvent(Object source, WorkspaceMember member, Workspace workspace, 
                                    User acceptedBy, User invitedBy) {
        super(source);
        this.member = member;
        this.workspace = workspace;
        this.acceptedBy = acceptedBy;
        this.invitedBy = invitedBy;
    }
}
