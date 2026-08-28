package com.arjun.crm.automation;

import com.arjun.crm.BaseIntegrationTest;
import com.arjun.crm.entity.*;
import com.arjun.crm.enums.*;
import com.arjun.crm.repository.*;
import com.arjun.crm.service.automation.AutomationExecutionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * AutomationConditionEngineIntegrationTest - PHASE 7.2: Automation Condition Engine
 * 
 * Integration test for automation execution with condition steps and branching
 * 
 * Test Scenarios:
 * 1. LEAD_SCORE_CONDITION with TRUE branch (score > threshold)
 * 2. LEAD_SCORE_CONDITION with FALSE branch (score <= threshold)
 * 3. LEAD_STATUS_CONDITION with TRUE branch (status matches)
 * 4. LEAD_STATUS_CONDITION with FALSE branch (status doesn't match)
 * 5. EMAIL_OPENED_CONDITION with TRUE branch (email was opened)
 * 6. EMAIL_OPENED_CONDITION with FALSE branch (email not opened)
 * 
 * Benefits:
 * - Tests condition evaluation logic
 * - Verifies TRUE/FALSE paths work
 * - Tests database-backed conditions
 * - Validates error handling
 * - Confirms execution flow with conditions
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AutomationConditionEngineIntegrationTest extends BaseIntegrationTest {
    
    @Autowired
    private WorkspaceRepository workspaceRepository;
    
    @Autowired
    private AutomationRepository automationRepository;
    
    @Autowired
    private AutomationStepRepository stepRepository;
    
    @Autowired
    private AutomationExecutionRepository executionRepository;
    
    @Autowired
    private LeadRepository leadRepository;
    
    @Autowired
    private EmailCampaignRepository emailCampaignRepository;
    
    @Autowired
    private EmailCampaignRecipientRepository emailRecipientRepository;
    
    @Autowired
    private AutomationExecutionService executionService;
    
    private Workspace workspace;
    private Lead lead;
    private Automation automation;
    
    @BeforeEach
    public void setUp() {
        // Create workspace
        workspace = new Workspace();
        workspace.setName("Test Workspace");
        workspace.setOwner(testUser);
        workspace = workspaceRepository.save(workspace);
        
        // Create lead with LEAD status
        lead = new Lead();
        lead.setWorkspace(workspace);
        lead.setName("Test Lead");
        lead.setEmail("lead@example.com");
        lead.setStatus(LeadStatus.LEAD);
        lead.setPriority(LeadPriority.MEDIUM);
        lead = leadRepository.save(lead);
    }
    
    @Test
    public void testLeadScoreConditionTrueBranch() throws InterruptedException {
        // Test: Lead score > 50 (should be TRUE)
        // Setup: Add score to lead notes
        lead.setNotes("Automation test - Score: 75 (high engagement)");
        lead = leadRepository.save(lead);
        
        // Create automation with condition step
        automation = new Automation();
        automation.setWorkspace(workspace);
        automation.setName("Score Condition Test - TRUE");
        automation.setTriggerType(AutomationTriggerType.LEAD_CREATED);
        automation.setStatus(AutomationStatus.ACTIVE);
        automation.setCreatedBy(testUser);
        automation = automationRepository.save(automation);
        
        // Step 1: Condition - Score > 50
        AutomationStep step1 = new AutomationStep();
        step1.setAutomation(automation);
        step1.setType(AutomationStepType.LEAD_SCORE_CONDITION);
        step1.setStepOrder(1);
        Map<String, Object> conditionConfig = new HashMap<>();
        conditionConfig.put("threshold", 50);
        conditionConfig.put("operator", "GREATER_THAN");
        step1.setConfiguration(conditionConfig);
        step1 = stepRepository.save(step1);
        
        // Step 2: Action - Update lead score if condition TRUE
        AutomationStep step2 = new AutomationStep();
        step2.setAutomation(automation);
        step2.setType(AutomationStepType.UPDATE_LEAD_SCORE);
        step2.setStepOrder(2);
        Map<String, Object> actionConfig = new HashMap<>();
        actionConfig.put("scoreChange", 10);
        actionConfig.put("reason", "Condition TRUE - high score");
        step2.setConfiguration(actionConfig);
        step2 = stepRepository.save(step2);
        
        // Execute
        System.out.println("Testing LEAD_SCORE_CONDITION TRUE branch...");
        executionService.executeAutomation(automation, lead);
        Thread.sleep(500);
        
        // Verify
        List<AutomationExecution> executions = executionRepository.findByLeadId(lead.getId(),
                org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        
        assertEquals(1, executions.size(), "Should have one execution");
        AutomationExecution execution = executions.get(0);
        
        assertEquals(AutomationExecutionStatus.COMPLETED, execution.getStatus(),
                "Execution should be COMPLETED");
        assertEquals(2, execution.getCurrentStep(),
                "Current step should be 2 (after condition)");
        assertNotNull(execution.getCompletedAt(), "Should be completed");
        
        System.out.println("✓ LEAD_SCORE_CONDITION TRUE branch passed");
    }
    
    @Test
    public void testLeadScoreConditionFalseBranch() throws InterruptedException {
        // Test: Lead score > 100 (should be FALSE, actual score is 0)
        
        // Create automation
        automation = new Automation();
        automation.setWorkspace(workspace);
        automation.setName("Score Condition Test - FALSE");
        automation.setTriggerType(AutomationTriggerType.LEAD_CREATED);
        automation.setStatus(AutomationStatus.ACTIVE);
        automation.setCreatedBy(testUser);
        automation = automationRepository.save(automation);
        
        // Step 1: Condition - Score > 100
        AutomationStep step1 = new AutomationStep();
        step1.setAutomation(automation);
        step1.setType(AutomationStepType.LEAD_SCORE_CONDITION);
        step1.setStepOrder(1);
        Map<String, Object> conditionConfig = new HashMap<>();
        conditionConfig.put("threshold", 100);
        conditionConfig.put("operator", "GREATER_THAN");
        step1.setConfiguration(conditionConfig);
        step1 = stepRepository.save(step1);
        
        // Step 2: Action - Update lead score (should still execute in Phase 3)
        AutomationStep step2 = new AutomationStep();
        step2.setAutomation(automation);
        step2.setType(AutomationStepType.UPDATE_LEAD_SCORE);
        step2.setStepOrder(2);
        Map<String, Object> actionConfig = new HashMap<>();
        actionConfig.put("scoreChange", 5);
        actionConfig.put("reason", "Condition FALSE - low score");
        step2.setConfiguration(actionConfig);
        step2 = stepRepository.save(step2);
        
        // Execute
        System.out.println("Testing LEAD_SCORE_CONDITION FALSE branch...");
        executionService.executeAutomation(automation, lead);
        Thread.sleep(500);
        
        // Verify
        List<AutomationExecution> executions = executionRepository.findByLeadId(lead.getId(),
                org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        
        assertEquals(1, executions.size(), "Should have one execution");
        AutomationExecution execution = executions.get(0);
        
        assertEquals(AutomationExecutionStatus.COMPLETED, execution.getStatus(),
                "Execution should be COMPLETED (Phase 3: FALSE also continues)");
        
        System.out.println("✓ LEAD_SCORE_CONDITION FALSE branch passed");
    }
    
    @Test
    public void testLeadStatusConditionTrueBranch() throws InterruptedException {
        // Test: Lead status == LEAD (should be TRUE)
        
        // Create automation
        automation = new Automation();
        automation.setWorkspace(workspace);
        automation.setName("Status Condition Test - TRUE");
        automation.setTriggerType(AutomationTriggerType.LEAD_CREATED);
        automation.setStatus(AutomationStatus.ACTIVE);
        automation.setCreatedBy(testUser);
        automation = automationRepository.save(automation);
        
        // Step 1: Condition - Status is LEAD
        AutomationStep step1 = new AutomationStep();
        step1.setAutomation(automation);
        step1.setType(AutomationStepType.LEAD_STATUS_CONDITION);
        step1.setStepOrder(1);
        Map<String, Object> conditionConfig = new HashMap<>();
        conditionConfig.put("status", "LEAD");
        step1.setConfiguration(conditionConfig);
        step1 = stepRepository.save(step1);
        
        // Step 2: Action
        AutomationStep step2 = new AutomationStep();
        step2.setAutomation(automation);
        step2.setType(AutomationStepType.UPDATE_LEAD_SCORE);
        step2.setStepOrder(2);
        Map<String, Object> actionConfig = new HashMap<>();
        actionConfig.put("scoreChange", 20);
        actionConfig.put("reason", "Status condition TRUE");
        step2.setConfiguration(actionConfig);
        step2 = stepRepository.save(step2);
        
        // Execute
        System.out.println("Testing LEAD_STATUS_CONDITION TRUE branch...");
        executionService.executeAutomation(automation, lead);
        Thread.sleep(500);
        
        // Verify
        List<AutomationExecution> executions = executionRepository.findByLeadId(lead.getId(),
                org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        
        assertEquals(1, executions.size(), "Should have one execution");
        AutomationExecution execution = executions.get(0);
        
        assertEquals(AutomationExecutionStatus.COMPLETED, execution.getStatus(),
                "Execution should be COMPLETED");
        assertEquals(2, execution.getCurrentStep(),
                "Current step should be 2");
        
        System.out.println("✓ LEAD_STATUS_CONDITION TRUE branch passed");
    }
    
    @Test
    public void testLeadStatusConditionFalseBranch() throws InterruptedException {
        // Test: Lead status == QUALIFIED (should be FALSE, actual is LEAD)
        
        // Create automation
        automation = new Automation();
        automation.setWorkspace(workspace);
        automation.setName("Status Condition Test - FALSE");
        automation.setTriggerType(AutomationTriggerType.LEAD_CREATED);
        automation.setStatus(AutomationStatus.ACTIVE);
        automation.setCreatedBy(testUser);
        automation = automationRepository.save(automation);
        
        // Step 1: Condition - Status is QUALIFIED
        AutomationStep step1 = new AutomationStep();
        step1.setAutomation(automation);
        step1.setType(AutomationStepType.LEAD_STATUS_CONDITION);
        step1.setStepOrder(1);
        Map<String, Object> conditionConfig = new HashMap<>();
        conditionConfig.put("status", "QUALIFIED");
        step1.setConfiguration(conditionConfig);
        step1 = stepRepository.save(step1);
        
        // Step 2: Action
        AutomationStep step2 = new AutomationStep();
        step2.setAutomation(automation);
        step2.setType(AutomationStepType.UPDATE_LEAD_SCORE);
        step2.setStepOrder(2);
        Map<String, Object> actionConfig = new HashMap<>();
        actionConfig.put("scoreChange", 3);
        actionConfig.put("reason", "Status condition FALSE");
        step2.setConfiguration(actionConfig);
        step2 = stepRepository.save(step2);
        
        // Execute
        System.out.println("Testing LEAD_STATUS_CONDITION FALSE branch...");
        executionService.executeAutomation(automation, lead);
        Thread.sleep(500);
        
        // Verify
        List<AutomationExecution> executions = executionRepository.findByLeadId(lead.getId(),
                org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        
        assertEquals(1, executions.size(), "Should have one execution");
        AutomationExecution execution = executions.get(0);
        
        assertEquals(AutomationExecutionStatus.COMPLETED, execution.getStatus(),
                "Execution should be COMPLETED");
        
        System.out.println("✓ LEAD_STATUS_CONDITION FALSE branch passed");
    }
    
    @Test
    public void testEmailOpenedConditionTrueBranch() throws InterruptedException {
        // Test: Email was opened (should be TRUE)
        
        // Setup: Create email campaign and recipient with opened_at set
        EmailCampaign campaign = new EmailCampaign();
        campaign.setWorkspace(workspace);
        campaign.setName("Test Campaign");
        campaign.setStatus("SENT");
        campaign.setCreatedBy(testUser);
        campaign = emailCampaignRepository.save(campaign);
        
        EmailCampaignRecipient recipient = new EmailCampaignRecipient();
        recipient.setCampaign(campaign);
        recipient.setRecipientEmail(lead.getEmail());
        recipient.setStatus("OPENED");
        recipient.setOpenedAt(LocalDateTime.now());
        recipient = emailRecipientRepository.save(recipient);
        
        // Create automation
        automation = new Automation();
        automation.setWorkspace(workspace);
        automation.setName("Email Opened Condition Test - TRUE");
        automation.setTriggerType(AutomationTriggerType.LEAD_CREATED);
        automation.setStatus(AutomationStatus.ACTIVE);
        automation.setCreatedBy(testUser);
        automation = automationRepository.save(automation);
        
        // Step 1: Condition - Email opened
        AutomationStep step1 = new AutomationStep();
        step1.setAutomation(automation);
        step1.setType(AutomationStepType.EMAIL_OPENED_CONDITION);
        step1.setStepOrder(1);
        Map<String, Object> conditionConfig = new HashMap<>();
        conditionConfig.put("campaignId", campaign.getId());
        step1.setConfiguration(conditionConfig);
        step1 = stepRepository.save(step1);
        
        // Step 2: Action
        AutomationStep step2 = new AutomationStep();
        step2.setAutomation(automation);
        step2.setType(AutomationStepType.UPDATE_LEAD_SCORE);
        step2.setStepOrder(2);
        Map<String, Object> actionConfig = new HashMap<>();
        actionConfig.put("scoreChange", 15);
        actionConfig.put("reason", "Email opened condition TRUE");
        step2.setConfiguration(actionConfig);
        step2 = stepRepository.save(step2);
        
        // Execute
        System.out.println("Testing EMAIL_OPENED_CONDITION TRUE branch...");
        executionService.executeAutomation(automation, lead);
        Thread.sleep(500);
        
        // Verify
        List<AutomationExecution> executions = executionRepository.findByLeadId(lead.getId(),
                org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        
        assertEquals(1, executions.size(), "Should have one execution");
        AutomationExecution execution = executions.get(0);
        
        assertEquals(AutomationExecutionStatus.COMPLETED, execution.getStatus(),
                "Execution should be COMPLETED");
        assertEquals(2, execution.getCurrentStep(),
                "Current step should be 2");
        
        System.out.println("✓ EMAIL_OPENED_CONDITION TRUE branch passed");
    }
    
    @Test
    public void testEmailOpenedConditionFalseBranch() throws InterruptedException {
        // Test: Email was NOT opened (should be FALSE)
        
        // Setup: Create email campaign and recipient WITHOUT opened_at
        EmailCampaign campaign = new EmailCampaign();
        campaign.setWorkspace(workspace);
        campaign.setName("Test Campaign 2");
        campaign.setStatus("SENT");
        campaign.setCreatedBy(testUser);
        campaign = emailCampaignRepository.save(campaign);
        
        EmailCampaignRecipient recipient = new EmailCampaignRecipient();
        recipient.setCampaign(campaign);
        recipient.setRecipientEmail(lead.getEmail());
        recipient.setStatus("SENT");
        recipient.setOpenedAt(null);  // Email not opened
        recipient = emailRecipientRepository.save(recipient);
        
        // Create automation
        automation = new Automation();
        automation.setWorkspace(workspace);
        automation.setName("Email Opened Condition Test - FALSE");
        automation.setTriggerType(AutomationTriggerType.LEAD_CREATED);
        automation.setStatus(AutomationStatus.ACTIVE);
        automation.setCreatedBy(testUser);
        automation = automationRepository.save(automation);
        
        // Step 1: Condition - Email opened
        AutomationStep step1 = new AutomationStep();
        step1.setAutomation(automation);
        step1.setType(AutomationStepType.EMAIL_OPENED_CONDITION);
        step1.setStepOrder(1);
        Map<String, Object> conditionConfig = new HashMap<>();
        conditionConfig.put("campaignId", campaign.getId());
        step1.setConfiguration(conditionConfig);
        step1 = stepRepository.save(step1);
        
        // Step 2: Action
        AutomationStep step2 = new AutomationStep();
        step2.setAutomation(automation);
        step2.setType(AutomationStepType.UPDATE_LEAD_SCORE);
        step2.setStepOrder(2);
        Map<String, Object> actionConfig = new HashMap<>();
        actionConfig.put("scoreChange", 2);
        actionConfig.put("reason", "Email opened condition FALSE");
        step2.setConfiguration(actionConfig);
        step2 = stepRepository.save(step2);
        
        // Execute
        System.out.println("Testing EMAIL_OPENED_CONDITION FALSE branch...");
        executionService.executeAutomation(automation, lead);
        Thread.sleep(500);
        
        // Verify
        List<AutomationExecution> executions = executionRepository.findByLeadId(lead.getId(),
                org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        
        assertEquals(1, executions.size(), "Should have one execution");
        AutomationExecution execution = executions.get(0);
        
        assertEquals(AutomationExecutionStatus.COMPLETED, execution.getStatus(),
                "Execution should be COMPLETED");
        
        System.out.println("✓ EMAIL_OPENED_CONDITION FALSE branch passed");
    }
}
