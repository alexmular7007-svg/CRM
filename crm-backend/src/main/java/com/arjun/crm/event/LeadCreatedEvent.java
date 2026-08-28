package com.arjun.crm.event;

import com.arjun.crm.entity.Lead;
import com.arjun.crm.entity.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * LeadCreatedEvent - PHASE 3: Automation Trigger
 * 
 * Domain event published when a new lead is created
 * Used to trigger LEAD_CREATED automations
 * 
 * Listeners:
 * - AutomationEventListener: Finds matching LEAD_CREATED automations and executes them
 * - NotificationEventListener: Sends notifications (existing)
 * - Other listeners can be added without modifying event
 */
@Getter
public class LeadCreatedEvent extends ApplicationEvent {
    
    private final Lead lead;
    private final User createdBy;
    
    public LeadCreatedEvent(Object source, Lead lead, User createdBy) {
        super(source);
        this.lead = lead;
        this.createdBy = createdBy;
    }
}
