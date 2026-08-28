package com.arjun.crm.config;

import com.arjun.crm.entity.AutomationTemplate;
import com.arjun.crm.enums.AutomationStepType;
import com.arjun.crm.enums.AutomationTriggerType;
import com.arjun.crm.repository.AutomationTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * AutomationTemplateDataLoader - PHASE 9: Automation Templates
 *
 * Initializes 5 predefined automation templates at application startup.
 * These templates provide quick-start workflows for common automation scenarios.
 *
 * Templates Created:
 * 1. New Lead Welcome - Sends welcome email when lead is created
 * 2. Lead Magnet Follow-up - Sends follow-up after lead magnet submission
 * 3. Email Engagement Follow-up - Sends follow-up to engaged leads
 * 4. Customer Onboarding - Multi-step onboarding sequence for new customers
 * 5. Lead Re-engagement - Re-engages inactive leads with targeted campaign
 *
 * Each template generates real Automation and AutomationStep configurations
 * that are compatible with the existing workflow engine.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AutomationTemplateDataLoader implements CommandLineRunner {

    private final AutomationTemplateRepository templateRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info("Loading automation templates...");

        // Only load templates if none exist
        if (templateRepository.count() == 0) {
            templateRepository.saveAll(Arrays.asList(
                    createTemplate1_NewLeadWelcome(),
                    createTemplate2_LeadMagnetFollowup(),
                    createTemplate3_EmailEngagementFollowup(),
                    createTemplate4_CustomerOnboarding(),
                    createTemplate5_LeadReengagement()
            ));
            log.info("✓ 5 automation templates loaded successfully");
        } else {
            log.info("Automation templates already exist, skipping data load");
        }
    }

    /**
     * Template 1: New Lead Welcome
     * Trigger: LEAD_CREATED
     * Workflow: Send welcome email → Update lead status → Increment lead score
     */
    private AutomationTemplate createTemplate1_NewLeadWelcome() {
        return AutomationTemplate.builder()
                .name("New Lead Welcome")
                .description("Send a personalized welcome email when a new lead is created. Great for making a strong first impression!")
                .category("welcome")
                .icon("👋")
                .triggerType(AutomationTriggerType.LEAD_CREATED)
                .triggerConfig(new HashMap<>())
                .steps(Arrays.asList(
                        // Step 1: Send Welcome Email
                        new HashMap<String, Object>() {{
                            put("stepOrder", 1);
                            put("type", AutomationStepType.SEND_EMAIL.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("subject", "Welcome to our platform!");
                                put("emailTemplateId", null);  // User customizes
                                put("recipientField", "email");
                            }});
                            put("enabled", true);
                        }},
                        // Step 2: Update Lead Status
                        new HashMap<String, Object>() {{
                            put("stepOrder", 2);
                            put("type", AutomationStepType.UPDATE_LEAD.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("fields", new HashMap<String, Object>() {{
                                    put("status", "CONTACTED");
                                }});
                            }});
                            put("enabled", true);
                        }},
                        // Step 3: Increment Lead Score
                        new HashMap<String, Object>() {{
                            put("stepOrder", 3);
                            put("type", AutomationStepType.UPDATE_LEAD_SCORE.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("scoreChange", 5);
                                put("reason", "Welcome email sent to new lead");
                            }});
                            put("enabled", true);
                        }}
                ))
                .isActive(true)
                .usageCount(0L)
                .build();
    }

    /**
     * Template 2: Lead Magnet Follow-up
     * Trigger: LEAD_MAGNET_SUBMITTED
     * Workflow: Send thank you email → Wait 24 hours → Send follow-up email → Update lead score
     */
    private AutomationTemplate createTemplate2_LeadMagnetFollowup() {
        return AutomationTemplate.builder()
                .name("Lead Magnet Follow-up")
                .description("Send immediate thank you email after lead magnet submission, then follow up 24 hours later. Perfect for nurturing interested leads!")
                .category("engagement")
                .icon("📧")
                .triggerType(AutomationTriggerType.LEAD_MAGNET_SUBMITTED)
                .triggerConfig(new HashMap<String, Object>() {{
                    put("leadMagnetIds", new ArrayList<>());  // User customizes
                    put("delay", 0);
                }})
                .steps(Arrays.asList(
                        // Step 1: Send Thank You Email
                        new HashMap<String, Object>() {{
                            put("stepOrder", 1);
                            put("type", AutomationStepType.SEND_EMAIL.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("subject", "Your lead magnet is on the way!");
                                put("emailTemplateId", null);
                                put("recipientField", "email");
                            }});
                            put("enabled", true);
                        }},
                        // Step 2: Wait 24 Hours
                        new HashMap<String, Object>() {{
                            put("stepOrder", 2);
                            put("type", AutomationStepType.WAIT_DURATION.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("duration", 24);
                                put("unit", "HOURS");
                            }});
                            put("enabled", true);
                        }},
                        // Step 3: Send Follow-up Email
                        new HashMap<String, Object>() {{
                            put("stepOrder", 3);
                            put("type", AutomationStepType.SEND_EMAIL.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("subject", "Next steps for your lead magnet");
                                put("emailTemplateId", null);
                                put("recipientField", "email");
                            }});
                            put("enabled", true);
                        }},
                        // Step 4: Increment Lead Score
                        new HashMap<String, Object>() {{
                            put("stepOrder", 4);
                            put("type", AutomationStepType.UPDATE_LEAD_SCORE.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("scoreChange", 10);
                                put("reason", "Lead magnet submitted and follow-up sent");
                            }});
                            put("enabled", true);
                        }}
                ))
                .isActive(true)
                .usageCount(0L)
                .build();
    }

    /**
     * Template 3: Email Engagement Follow-up
     * Trigger: EMAIL_OPENED
     * Workflow: Check if email opened → Send targeted follow-up → Update lead score
     */
    private AutomationTemplate createTemplate3_EmailEngagementFollowup() {
        return AutomationTemplate.builder()
                .name("Email Engagement Follow-up")
                .description("Automatically send a follow-up email when a recipient opens your email. Capitalize on their interest!")
                .category("engagement")
                .icon("📬")
                .triggerType(AutomationTriggerType.EMAIL_OPENED)
                .triggerConfig(new HashMap<String, Object>() {{
                    put("emailCampaignIds", new ArrayList<>());  // User customizes
                }})
                .steps(Arrays.asList(
                        // Step 1: Send Follow-up Email
                        new HashMap<String, Object>() {{
                            put("stepOrder", 1);
                            put("type", AutomationStepType.SEND_EMAIL.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("subject", "I saw you were interested...");
                                put("emailTemplateId", null);
                                put("recipientField", "email");
                            }});
                            put("enabled", true);
                        }},
                        // Step 2: Increment Lead Score
                        new HashMap<String, Object>() {{
                            put("stepOrder", 2);
                            put("type", AutomationStepType.UPDATE_LEAD_SCORE.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("scoreChange", 15);
                                put("reason", "Email opened and follow-up sent");
                            }});
                            put("enabled", true);
                        }},
                        // Step 3: Update Lead Status
                        new HashMap<String, Object>() {{
                            put("stepOrder", 3);
                            put("type", AutomationStepType.UPDATE_LEAD.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("fields", new HashMap<String, Object>() {{
                                    put("status", "QUALIFIED");
                                }});
                            }});
                            put("enabled", true);
                        }}
                ))
                .isActive(true)
                .usageCount(0L)
                .build();
    }

    /**
     * Template 4: Customer Onboarding
     * Trigger: LEAD_CREATED
     * Workflow: Send welcome → Wait 2 days → Send onboarding guide → Wait 3 days → Send next steps
     */
    private AutomationTemplate createTemplate4_CustomerOnboarding() {
        return AutomationTemplate.builder()
                .name("Customer Onboarding")
                .description("Multi-step onboarding sequence for new customers. Guides them through setup and best practices over a week.")
                .category("onboarding")
                .icon("🚀")
                .triggerType(AutomationTriggerType.LEAD_CREATED)
                .triggerConfig(new HashMap<>())
                .steps(Arrays.asList(
                        // Step 1: Send Welcome Email
                        new HashMap<String, Object>() {{
                            put("stepOrder", 1);
                            put("type", AutomationStepType.SEND_EMAIL.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("subject", "Welcome! Let's get you started");
                                put("emailTemplateId", null);
                                put("recipientField", "email");
                            }});
                            put("enabled", true);
                        }},
                        // Step 2: Wait 2 Days
                        new HashMap<String, Object>() {{
                            put("stepOrder", 2);
                            put("type", AutomationStepType.WAIT_DURATION.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("duration", 2);
                                put("unit", "DAYS");
                            }});
                            put("enabled", true);
                        }},
                        // Step 3: Send Onboarding Guide
                        new HashMap<String, Object>() {{
                            put("stepOrder", 3);
                            put("type", AutomationStepType.SEND_EMAIL.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("subject", "Your complete onboarding guide");
                                put("emailTemplateId", null);
                                put("recipientField", "email");
                            }});
                            put("enabled", true);
                        }},
                        // Step 4: Wait 3 Days
                        new HashMap<String, Object>() {{
                            put("stepOrder", 4);
                            put("type", AutomationStepType.WAIT_DURATION.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("duration", 3);
                                put("unit", "DAYS");
                            }});
                            put("enabled", true);
                        }},
                        // Step 5: Send Next Steps
                        new HashMap<String, Object>() {{
                            put("stepOrder", 5);
                            put("type", AutomationStepType.SEND_EMAIL.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("subject", "Next steps to maximize value");
                                put("emailTemplateId", null);
                                put("recipientField", "email");
                            }});
                            put("enabled", true);
                        }},
                        // Step 6: Update Status to Customer
                        new HashMap<String, Object>() {{
                            put("stepOrder", 6);
                            put("type", AutomationStepType.UPDATE_LEAD.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("fields", new HashMap<String, Object>() {{
                                    put("status", "CUSTOMER");
                                }});
                            }});
                            put("enabled", true);
                        }}
                ))
                .isActive(true)
                .usageCount(0L)
                .build();
    }

    /**
     * Template 5: Lead Re-engagement
     * Trigger: LEAD_CREATED
     * Workflow: Send initial email → Wait 7 days → Send re-engagement email → Update status
     */
    private AutomationTemplate createTemplate5_LeadReengagement() {
        return AutomationTemplate.builder()
                .name("Lead Re-engagement")
                .description("Win back inactive leads with a targeted re-engagement campaign. Perfect for revitalizing cold leads!")
                .category("re-engagement")
                .icon("🔄")
                .triggerType(AutomationTriggerType.LEAD_CREATED)
                .triggerConfig(new HashMap<>())
                .steps(Arrays.asList(
                        // Step 1: Send Initial Email
                        new HashMap<String, Object>() {{
                            put("stepOrder", 1);
                            put("type", AutomationStepType.SEND_EMAIL.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("subject", "We miss you! Here's what's new");
                                put("emailTemplateId", null);
                                put("recipientField", "email");
                            }});
                            put("enabled", true);
                        }},
                        // Step 2: Wait 7 Days
                        new HashMap<String, Object>() {{
                            put("stepOrder", 2);
                            put("type", AutomationStepType.WAIT_DURATION.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("duration", 7);
                                put("unit", "DAYS");
                            }});
                            put("enabled", true);
                        }},
                        // Step 3: Send Re-engagement Email
                        new HashMap<String, Object>() {{
                            put("stepOrder", 3);
                            put("type", AutomationStepType.SEND_EMAIL.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("subject", "Last chance: Special offer inside");
                                put("emailTemplateId", null);
                                put("recipientField", "email");
                            }});
                            put("enabled", true);
                        }},
                        // Step 4: Increment Lead Score
                        new HashMap<String, Object>() {{
                            put("stepOrder", 4);
                            put("type", AutomationStepType.UPDATE_LEAD_SCORE.toString());
                            put("configuration", new HashMap<String, Object>() {{
                                put("scoreChange", 3);
                                put("reason", "Re-engagement campaign executed");
                            }});
                            put("enabled", true);
                        }}
                ))
                .isActive(true)
                .usageCount(0L)
                .build();
    }
}
