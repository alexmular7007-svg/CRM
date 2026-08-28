package com.arjun.crm.service.automation;

import com.arjun.crm.automation.condition.ConditionEvaluator;
import com.arjun.crm.automation.condition.ConditionExecutorFactory;
import com.arjun.crm.automation.executor.AutomationStepExecutor;
import com.arjun.crm.automation.executor.StepExecutorFactory;
import com.arjun.crm.entity.Automation;
import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.enums.AutomationExecutionStatus;
import com.arjun.crm.enums.AutomationStepType;
import com.arjun.crm.repository.AutomationExecutionRepository;
import com.arjun.crm.repository.AutomationRepository;
import com.arjun.crm.repository.AutomationStepRepository;
import com.arjun.crm.service.automation.impl.AutomationExecutionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutomationExecutionServiceImplTest {

    @Mock AutomationRepository automationRepository;
    @Mock AutomationStepRepository stepRepository;
    @Mock AutomationExecutionRepository executionRepository;
    @Mock StepExecutorFactory stepExecutorFactory;
    @Mock ConditionExecutorFactory conditionExecutorFactory;
    @Mock AutomationStepExecutor stepExecutor;
    @Mock ConditionEvaluator conditionEvaluator;

    private AutomationExecutionServiceImpl service;
    private Automation automation;
    private Lead lead;

    @BeforeEach
    void setUp() {
        service = new AutomationExecutionServiceImpl(
                automationRepository, stepRepository, executionRepository,
                stepExecutorFactory, conditionExecutorFactory);
        var workspace = com.arjun.crm.entity.Workspace.builder().id(10L).build();
        automation = Automation.builder().id(20L).workspace(workspace).build();
        lead = Lead.builder().id(60L).email("lead@example.com").build();
        when(executionRepository.countRecentExecutions(any(), any(), any())).thenReturn(0L);
        when(executionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void skipsDisabledSteps() {
        AutomationStep enabled = AutomationStep.builder().id(1L).automation(automation)
                .stepOrder(1).type(AutomationStepType.UPDATE_LEAD_SCORE).enabled(true).build();
        when(stepRepository.findEnabledByAutomationIdAndWorkspaceId(20L, 10L))
                .thenReturn(List.of(enabled));
        when(stepExecutorFactory.getExecutor(AutomationStepType.UPDATE_LEAD_SCORE)).thenReturn(stepExecutor);
        when(stepExecutor.execute(eq(enabled), any(), eq(lead))).thenReturn(AutomationStepExecutor.StepExecutionResult.success());

        service.executeAutomation(automation, lead);

        verify(stepExecutor).execute(eq(enabled), any(), eq(lead));
        verify(stepRepository).findEnabledByAutomationIdAndWorkspaceId(20L, 10L);
    }

    @Test
    void stopsWhenConditionEvaluationFails() {
        AutomationStep condition = AutomationStep.builder().id(1L).automation(automation)
                .stepOrder(1).type(AutomationStepType.LEAD_SCORE_CONDITION).enabled(true).build();
        AutomationStep later = AutomationStep.builder().id(2L).automation(automation)
                .stepOrder(2).type(AutomationStepType.UPDATE_LEAD_SCORE).enabled(true).build();
        when(stepRepository.findEnabledByAutomationIdAndWorkspaceId(20L, 10L))
                .thenReturn(List.of(condition, later));
        when(conditionExecutorFactory.getEvaluator(AutomationStepType.LEAD_SCORE_CONDITION)).thenReturn(conditionEvaluator);
        when(conditionEvaluator.evaluate(eq(condition), any(), eq(lead)))
                .thenReturn(ConditionEvaluator.ConditionResult.error("invalid condition"));

        service.executeAutomation(automation, lead);

        verify(conditionEvaluator).evaluate(eq(condition), any(), eq(lead));
        verify(stepExecutorFactory, never()).getExecutor(AutomationStepType.UPDATE_LEAD_SCORE);
        verify(executionRepository, atLeastOnce()).save(argThat(execution ->
                execution.getStatus() == AutomationExecutionStatus.FAILED &&
                        "Condition evaluation failed: invalid condition".equals(execution.getError())));
    }
}