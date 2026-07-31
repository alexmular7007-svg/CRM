package com.arjun.crm.dto.response;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Response after successful lead magnet form submission
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionResponse {

    private Long leadId;           // Created lead ID
    private String name;
    private String email;
    private String phone;
    private String company;
    private String status;         // COLD_LEAD, HOT_LEAD, etc.
    private String magnetName;     // Campaign name
    private LocalDateTime submittedAt;
    private String thankYouMessage; // Message to show user after submission
}
