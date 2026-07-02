package com.arjun.crm.event;

import com.arjun.crm.entity.Lead;
import com.arjun.crm.entity.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * ENTERPRISE NOTIFICATION CENTER
 * Event published when a CRM lead is updated
 */
@Getter
public class LeadUpdatedEvent extends ApplicationEvent {
    
    private final Lead lead;
    private final User updatedBy;
    private final String changeDescription;

    public LeadUpdatedEvent(Object source, Lead lead, User updatedBy, String changeDescription) {
        super(source);
        this.lead = lead;
        this.updatedBy = updatedBy;
        this.changeDescription = changeDescription;
    }
}
