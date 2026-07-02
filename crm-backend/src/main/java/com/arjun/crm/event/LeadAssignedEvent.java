package com.arjun.crm.event;

import com.arjun.crm.entity.Lead;
import com.arjun.crm.entity.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * ENTERPRISE NOTIFICATION CENTER
 * Event published when a CRM lead is assigned to a user
 */
@Getter
public class LeadAssignedEvent extends ApplicationEvent {
    
    private final Lead lead;
    private final User assignedTo;
    private final User assignedBy;

    public LeadAssignedEvent(Object source, Lead lead, User assignedTo, User assignedBy) {
        super(source);
        this.lead = lead;
        this.assignedTo = assignedTo;
        this.assignedBy = assignedBy;
    }
}
