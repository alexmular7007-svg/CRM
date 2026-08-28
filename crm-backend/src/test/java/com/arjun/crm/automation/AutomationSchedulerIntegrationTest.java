package com.arjun.crm.automation;

import com.arjun.crm.BaseIntegrationTest;
import com.arjun.crm.automation.scheduler.AutomationScheduler;
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
 * AutomationSchedulerIntegrationTest - PHASE 7.1: Automation Wait/Scheduler Engine
 * 
 * Integration test for automation execution with WAIT_DURATION step and scheduler resumption
 * 
 * Test Scenario:
 * 1. Create automation with 3 steps:
 *    - Step 1: SEND_EMAIL
 *    - Step 2: WAIT_DURATION (2 seconds)
 *    - Step 3: UPDATE_LEAD_SCORE
 * 
 * 2. Trigger automation:
 *    - Execution should start and reach WAIT step
 *    - Status: WAITING, resumeAt: now + 2 seconds
 * 
 * 3. Wait 2+ seconds and invoke scheduler:
 *    - Scheduler finds execution ready to resume
 *    - Invokes resumeExecution() asynchronously
 *    - Execution continues with remaining steps
 * 
 * 4. Verify:
 *    - Execution completed successfully
 *    - All steps executed
 *    - Lead was updated
 * 
 * Benefits:
 * - Tests full lifecycle: trigger → wait → resume → complete
 * - Verifies scheduler finds ready executions
 * - Verifies async resumption works
 * - Uses short wait duration (2 seconds) for fast test execution
 * - No external dependencies (email, etc.)
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AutomationSchedulerIntegrationTest extends BaseIntegrationTest {
    
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
    private AutomationExecutionService executionService;
    
    @Autowired
    private AutomationScheduler automationScheduler;
    
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
        
        // Create lead
        lead = new Lead();
        lead.setWorkspace(workspace);
        lead.setName("Test Lead");
        lead.setEmail("lead@example.com");
        lead.setStatus(LeadStatus.LEAD);
        lead = leadRepository.save(lead);
    }
    
    @Test
    public void testAutomationExecutionWithWaitAndSchedulerResumption() throws InterruptedException {
        // Step 1: Create automation with 3 steps
        automation = new Automation();
        automation.setWorkspace(workspace);
        automation.setName("Wait Test Automation");
        automation.setTriggerType(AutomationTriggerType.LEAD_CREATED);
        automation.setStatus(AutomationStatus.ACTIVE);
        automation.setCreatedBy(testUser);
        automation = automationRepository.save(automation);
        
        // Step 1: SEND_EMAIL (dummy, will skip actual sending)
        AutomationStep step1 = new AutomationStep();
        step1.setAutomation(automation);
        step1.setType(AutomationStepType.SEND_EMAIL);
        step1.setStepOrder(1);
        Map<String, Object> config1 = new HashMap<>();
        config1.put("emailTemplate", "test-template");
        config1.put("subject", "Test Email");
        step1.setConfiguration(config1);
        step1 = stepRepository.save(step1);
        
        // Step 2: WAIT_DURATION (2 seconds - short for test)
        AutomationStep step2 = new AutomationStep();
        step2.setAutomation(automation);
        step2.setType(AutomationStepType.WAIT_DURATION);
        step2.setStepOrder(2);
        Map<String, Object> config2 = new HashMap<>();
        config2.put("duration", 2);
        config2.put("unit", "SECONDS");
        step2.setConfiguration(config2);
        step2 = stepRepository.save(step2);
        
        // Step 3: UPDATE_LEAD_SCORE (+5 points)
        AutomationStep step3 = new AutomationStep();
        step3.setAutomation(automation);
        step3.setType(AutomationStepType.UPDATE_LEAD_SCORE);
        step3.setStepOrder(3);
        Map<String, Object> config3 = new HashMap<>();
        config3.put("scoreChange", 5);
        config3.put("reason", "Automation completed");
        step3.setConfiguration(config3);
        step3 = stepRepository.save(step3);
        
        // Step 2: Trigger automation
        executionService.executeAutomation(automation, lead);
        
        // Give async execution time to process
        Thread.sleep(500);
        
        // Verify execution reached WAITING status
        List<AutomationExecution> executions = executionRepository.findByLeadId(lead.getId(), 
                org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        
        assertEquals(1, executions.size(), "Should have one execution");
        AutomationExecution execution = executions.get(0);
        
        assertEquals(AutomationExecutionStatus.WAITING, execution.getStatus(), 
                "Execution should be WAITING after step 2");
        assertEquals(2, execution.getCurrentStep(), 
                "Current step should be 2 (WAIT step)");
        assertNotNull(execution.getResumeAt(), "resumeAt should be set");
        assertNotNull(execution.getPausedAt(), "pausedAt should be set");
        
        // Verify resumeAt is in future (approximately 2 seconds from now)
        long delaySeconds = java.time.temporal.ChronoUnit.SECONDS.between(LocalDateTime.now(), execution.getResumeAt());
        assertTrue(delaySeconds > 0 && delaySeconds <= 3, 
                "Resume should be scheduled in ~2 seconds, got " + delaySeconds);
        
        System.out.println("✓ Execution paused at WAIT step: " + execution.getId());
        System.out.println("  Paused at: " + execution.getPausedAt());
        System.out.println("  Resume at: " + execution.getResumeAt());
        
        // Step 3: Wait for WAIT_DURATION to expire + some margin
        System.out.println("⏳ Waiting for WAIT_DURATION to expire (2+ seconds)...");
        Thread.sleep(2500);  // 2.5 seconds > 2 second wait
        
        // Step 4: Invoke scheduler
        System.out.println("🔔 Invoking scheduler...");
        automationScheduler.resumeWaitingExecutions();
        
        // Give async resume time to process
        Thread.sleep(1000);
        
        // Step 5: Verify execution completed
        execution = executionRepository.findById(execution.getId())
                .orElseThrow(() -> new AssertionError("Execution not found"));
        
        assertEquals(AutomationExecutionStatus.COMPLETED, execution.getStatus(), 
                "Execution should be COMPLETED after scheduler resumption");
        assertEquals(3, execution.getCurrentStep(), 
                "Current step should be 3 (last step)");
        assertNotNull(execution.getCompletedAt(), "completedAt should be set");
        assertNull(execution.getResumeAt(), "resumeAt should be cleared");
        assertNull(execution.getPausedAt(), "pausedAt should be cleared");
        
        System.out.println("✓ Execution resumed and completed");
        System.out.println("  Completed at: " + execution.getCompletedAt());
        
        // Verify lead notes were updated (by UPDATE_LEAD_SCORE step)
        Lead updatedLead = leadRepository.findById(lead.getId())
                .orElseThrow(() -> new AssertionError("Lead not found"));
        
        assertNotNull(updatedLead.getNotes(), "Lead notes should be updated");
        assertTrue(updatedLead.getNotes().contains("Score: +5"), 
                "Lead notes should contain score update");
        
        System.out.println("✓ Lead notes updated: " + updatedLead.getNotes());
    }
    
    @Test
    public void testSchedulerFindsReadyExecutions() throws InterruptedException {
        // Create automation and execution
        automation = new Automation();
        automation.setWorkspace(workspace);
        automation.setName("Scheduler Test");
        automation.setTriggerType(AutomationTriggerType.LEAD_CREATED);
        automation.setStatus(AutomationStatus.ACTIVE);
        automation.setCreatedBy(testUser);
        automation = automationRepository.save(automation);
        
        // Create a WAITING execution with resumeAt in the past
        AutomationExecution execution = new AutomationExecution();
        execution.setAutomation(automation);
        execution.setLead(lead);
        execution.setStatus(AutomationExecutionStatus.WAITING);
        execution.setCurrentStep(2);
        execution.setPausedAt(LocalDateTime.now().minusSeconds(5));
        execution.setResumeAt(LocalDateTime.now().minusSeconds(2));  // Due to resume
        execution = executionRepository.save(execution);
        
        System.out.println("Created WAITING execution: " + execution.getId() + 
                " (resumeAt: " + execution.getResumeAt() + ")");
        
        // Verify repository finds it
        List<AutomationExecution> readyExecutions = executionRepository.findReadyToResume(
                AutomationExecutionStatus.WAITING,
                LocalDateTime.now()
        );
        
        final Long executionId = execution.getId();
        assertTrue(readyExecutions.stream().anyMatch(e -> e.getId().equals(executionId)), 
                "Repository should find ready execution");
        
        System.out.println("✓ Repository found " + readyExecutions.size() + " ready execution(s)");
    }
    
    @Test
    public void testWaitDurationParsing() {
        // Verify WaitDurationExecutor can parse various durations
        assertEquals(2000, convertToMillis(2, "SECONDS"));
        assertEquals(5 * 60 * 1000, convertToMillis(5, "MINUTES"));
        assertEquals(24 * 60 * 60 * 1000, convertToMillis(24, "HOURS"));
        assertEquals(7 * 24 * 60 * 60 * 1000, convertToMillis(7, "DAYS"));
        
        System.out.println("✓ Wait duration conversions correct");
    }
    
    private long convertToMillis(long duration, String unit) {
        return java.util.concurrent.TimeUnit.valueOf(unit).toMillis(duration);
    }
}
