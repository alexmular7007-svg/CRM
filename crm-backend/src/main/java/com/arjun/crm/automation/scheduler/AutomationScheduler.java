package com.arjun.crm.automation.scheduler;

import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.enums.AutomationExecutionStatus;
import com.arjun.crm.repository.AutomationExecutionRepository;
import com.arjun.crm.service.automation.AutomationExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AutomationScheduler - PHASE 7.1: Automation Wait/Scheduler Engine
 * 
 * Periodically checks for automation executions that have completed their WAIT_DURATION
 * and resumes their execution.
 * 
 * Responsibilities:
 * 1. Periodically find executions with status=WAITING and resumeAt <= now
 * 2. For each ready execution, invoke resumeExecution() asynchronously
 * 3. Handle failures gracefully (don't stop scheduler)
 * 4. Log all operations for monitoring and debugging
 * 
 * Thread Safety:
 * - Uses @Scheduled with Spring's scheduling thread pool
 * - Each resume call is @Async (non-blocking)
 * - Database queries are transactional
 * - Duplicates prevented by transaction boundaries
 * 
 * Performance:
 * - Configurable interval via application.yml
 * - Default: 15 seconds (scheduler.automation.resumeInterval)
 * - Uses partial index: automation_executions(resume_at WHERE status='WAITING')
 * - Batch processes all due executions in single query
 * 
 * Failure Handling:
 * - Individual resume failures don't stop scheduler
 * - Failed resumes logged with details
 * - Execution state remains WAITING if resume fails
 * - Can be retried in next scheduler cycle
 * 
 * Server Restart:
 * - Scheduler starts automatically via @EnableScheduling
 * - findReadyToResume() query is idempotent
 * - Duplicate prevention enforced by transaction boundaries
 * - No state maintained in memory
 * 
 * Example Flow:
 * 1. Trigger: Lead Created → Automation starts
 * 2. Step 1: Send Email → SUCCESS
 * 3. Step 2: Wait 2 seconds → WAITING (resumeAt = now + 2s)
 * 4. Scheduler finds execution 2 seconds later
 * 5. Calls resumeExecution(id) → execution becomes RUNNING
 * 6. Step 3+: Execute remaining steps → COMPLETED
 * 
 * Monitoring:
 * Check logs for:
 * - "Automation scheduler tick"
 * - "Found N executions ready to resume"
 * - "Resuming execution" (info)
 * - "Error resuming execution" (error)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AutomationScheduler {
    
    private final AutomationExecutionRepository executionRepository;
    private final AutomationExecutionService executionService;
    
    /**
     * Scheduler interval in milliseconds
     * Default: 15000ms (15 seconds)
     * Configurable via: scheduler.automation.resumeInterval
     * 
     * Formula: every N milliseconds
     * Example: 15000 = check every 15 seconds
     */
    @Value("${scheduler.automation.resumeInterval:15000}")
    private long resumeInterval;
    
    /**
     * Periodic task to find and resume waiting executions
     * 
     * Runs every N milliseconds (configurable)
     * fixedDelayString: delay between END of last execution and START of next
     * initialDelayString: delay before first execution (allows app startup)
     * 
     * Example timing:
     * 00:00:00 - Scheduler starts
     * 00:00:05 - First check (initialDelayString: 5000)
     * 00:00:20 - Second check (resumeInterval: 15000)
     * 00:00:35 - Third check
     * etc.
     */
    @Scheduled(fixedDelayString = "${scheduler.automation.resumeInterval:15000}",
               initialDelayString = "${scheduler.automation.initialDelay:5000}")
    public void resumeWaitingExecutions() {
        log.debug("Automation scheduler tick");
        
        try {
            LocalDateTime now = LocalDateTime.now();
            
            // Find all executions ready to resume
            List<AutomationExecution> readyExecutions = executionRepository.findReadyToResume(
                    AutomationExecutionStatus.WAITING,
                    now
            );
            
            if (readyExecutions.isEmpty()) {
                log.debug("No executions ready to resume");
                return;
            }
            
            log.info("Found {} executions ready to resume", readyExecutions.size());
            
            // Resume each execution asynchronously
            for (AutomationExecution execution : readyExecutions) {
                try {
                    log.info("Resuming execution: {} (Lead: {}, Automation: {}, resumeAt: {})",
                            execution.getId(),
                            execution.getLead() != null ? execution.getLead().getId() : "N/A",
                            execution.getAutomation().getId(),
                            execution.getResumeAt());
                    
                    // Invoke async resume - doesn't block scheduler
                    executionService.resumeExecution(execution.getId());
                    
                } catch (Exception e) {
                    log.error("Error resuming execution: {}", execution.getId(), e);
                    // Continue with next execution - don't let one failure block others
                }
            }
            
            log.info("Resumed {} executions", readyExecutions.size());
            
        } catch (Exception e) {
            log.error("Error in automation scheduler", e);
            // Continue - scheduler will retry next cycle
        }
    }
}
