package com.arjun.crm.event;

import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * ENTERPRISE NOTIFICATION CENTER
 * Event published when AI generates insights for a user
 */
@Getter
public class AIInsightsEvent extends ApplicationEvent {
    
    private final User recipient;
    private final Workspace workspace;
    private final String insightTitle;
    private final String insightMessage;
    private final String insightType; // e.g., "RISK", "OPPORTUNITY", "RECOMMENDATION"

    public AIInsightsEvent(Object source, User recipient, Workspace workspace,
                          String insightTitle, String insightMessage, String insightType) {
        super(source);
        this.recipient = recipient;
        this.workspace = workspace;
        this.insightTitle = insightTitle;
        this.insightMessage = insightMessage;
        this.insightType = insightType;
    }
}
