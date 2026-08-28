package com.arjun.crm.automation;

import com.arjun.crm.automation.executor.SendEmailActionExecutor;
import com.arjun.crm.entity.Automation;
import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.repository.EmailCampaignRepository;
import com.arjun.crm.repository.EmailTemplateRepository;
import com.arjun.crm.service.automation.AutomationEmailRecipientService;
import com.arjun.crm.service.brevo.BrevoEmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SendEmailActionExecutorTest {

    @Mock BrevoEmailService brevoEmailService;
    @Mock EmailTemplateRepository emailTemplateRepository;
    @Mock EmailCampaignRepository emailCampaignRepository;
    @Mock AutomationEmailRecipientService recipientService;

    private SendEmailActionExecutor executor;
    private AutomationExecution execution;
    private AutomationStep step;
    private Lead lead;
    private EmailCampaign campaign;

    @BeforeEach
    void setUp() {
        executor = new SendEmailActionExecutor(
                brevoEmailService, emailTemplateRepository, emailCampaignRepository, recipientService);
        var workspace = com.arjun.crm.entity.Workspace.builder().id(10L).build();
        Automation automation = Automation.builder().id(20L).workspace(workspace).build();
        execution = AutomationExecution.builder().id(30L).automation(automation).build();
        step = AutomationStep.builder().id(40L).automation(automation).build();
        lead = Lead.builder().id(60L).email("lead@example.com").build();
        campaign = EmailCampaign.builder().id(50L).workspace(workspace).build();
    }

    @Test
    void rejectsLegacyTemplateOnlyConfigurationClearly() {
        step.setConfiguration(Map.of("emailTemplateId", 99));

        var result = executor.execute(step, execution, lead);

        assertFalse(result.isSuccess());
        assertEquals("emailCampaignId is required in SEND_EMAIL configuration", result.getErrorMessage());
        verifyNoInteractions(recipientService, brevoEmailService);
    }

    @Test
    void rejectsUnsupportedRecipientField() {
        Map<String, Object> config = new HashMap<>();
        config.put("emailCampaignId", 50);
        config.put("recipientField", "phone");
        step.setConfiguration(config);
        when(emailCampaignRepository.findByIdAndWorkspaceId(50L, 10L)).thenReturn(Optional.of(campaign));

        var result = executor.execute(step, execution, lead);

        assertFalse(result.isSuccess());
        assertEquals("Unsupported recipientField: only 'email' is supported", result.getErrorMessage());
        verifyNoInteractions(recipientService, brevoEmailService);
    }
}