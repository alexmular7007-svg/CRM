package com.arjun.crm.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

/** Persisted delivery/engagement event received from tracking or a provider webhook. */
@Data
@Builder
public class EmailCampaignEventResponse {
    private Long id;
    private Long recipientId;
    private String recipientEmail;
    private String eventType;
    private LocalDateTime occurredAt;
    private String linkUrl;
    private String bounceReason;
    private Map<String, Object> metadata;
}
