package com.arjun.crm.service;

import com.arjun.crm.dto.request.BrowserTestRunRequest;
import com.arjun.crm.dto.request.CreateChromeExtensionRequest;
import com.arjun.crm.dto.request.CreateTestCaseRequest;
import com.arjun.crm.dto.request.UpdateChromeExtensionRequest;
import com.arjun.crm.dto.request.UpdateTestCaseRequest;
import com.arjun.crm.dto.response.BrowserTestRunResponse;
import com.arjun.crm.dto.response.ChromeExtensionResponse;
import com.arjun.crm.dto.response.TestCaseResponse;
import com.arjun.crm.dto.response.TestResultResponse;
import com.arjun.crm.dto.response.TestRunResponse;
import com.arjun.crm.entity.ChromeExtension;
import com.arjun.crm.entity.ChromeExtensionTestCase;
import com.arjun.crm.entity.ChromeExtensionTestResult;
import com.arjun.crm.entity.ChromeExtensionTestRun;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.ChromeExtensionStatus;
import com.arjun.crm.enums.TestCaseType;
import com.arjun.crm.enums.TestResultStatus;
import com.arjun.crm.enums.TestRunStatus;
import com.arjun.crm.enums.WorkspaceRole;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.ChromeExtensionRepository;
import com.arjun.crm.repository.ChromeExtensionTestCaseRepository;
import com.arjun.crm.repository.ChromeExtensionTestResultRepository;
import com.arjun.crm.repository.ChromeExtensionTestRunRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.ChromeExtensionTestExecutionService;
import com.arjun.crm.service.impl.ChromeExtensionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChromeExtensionServiceTest {

    @Mock
    private ChromeExtensionRepository chromeExtensionRepository;

    @Mock
    private ChromeExtensionTestCaseRepository testCaseRepository;

    @Mock
    private ChromeExtensionTestRunRepository testRunRepository;

    @Mock
    private ChromeExtensionTestResultRepository testResultRepository;

    @Mock
    private ChromeExtensionTestExecutionService testExecutionService;

    @Mock
    private WorkspaceRepository workspaceRepository;

    @Mock
    private WorkspaceAuthorizationService workspaceAuthService;

    @Mock
    private ChromeExtensionRunnerClient runnerClient;

    @InjectMocks
    private ChromeExtensionServiceImpl chromeExtensionService;

    private Workspace testWorkspace;
    private User testUser;
    private WorkspaceMember adminMember;
    private WorkspaceMember regularMember;
    private ChromeExtension testExtension;
    private ChromeExtensionTestCase testCase;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("admin@test.com")
                .firstName("John")
                .lastName("Doe")
                .build();

        testWorkspace = Workspace.builder()
                .id(10L)
                .name("Test Workspace")
                .owner(testUser)
                .build();

        adminMember = WorkspaceMember.builder()
                .id(100L)
                .workspace(testWorkspace)
                .user(testUser)
                .role(WorkspaceRole.ADMIN)
                .build();

        regularMember = WorkspaceMember.builder()
                .id(101L)
                .workspace(testWorkspace)
                .user(testUser)
                .role(WorkspaceRole.MEMBER)
                .build();

        testExtension = ChromeExtension.builder()
                .id(50L)
                .workspace(testWorkspace)
                .name("CRM Lead Hunter")
                .description("Extension for testing CRM lead extraction")
                .version("1.0.0")
                .status(ChromeExtensionStatus.ACTIVE)
                .manifestJson(Map.of("manifest_version", 3, "name", "CRM Lead Hunter"))
                .createdBy(testUser)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testCase = ChromeExtensionTestCase.builder()
                .id(200L)
                .extension(testExtension)
                .name("Create Lead via API")
                .description("Tests POST /api/leads from extension popup")
                .testType(TestCaseType.API_CRUD)
                .configuration(Map.of("method", "POST", "url", "/api/leads"))
                .expectedResult(Map.of("status", 201))
                .enabled(true)
                .displayOrder(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Chrome Extension Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Create Extension - Success")
    void createExtension_Success() {
        CreateChromeExtensionRequest request = CreateChromeExtensionRequest.builder()
                .name("CRM Lead Hunter")
                .description("Extension for testing CRM lead extraction")
                .version("1.0.0")
                .manifestJson(Map.of("manifest_version", 3))
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(adminMember);
        doNothing().when(workspaceAuthService).validateOwnerOrAdmin(adminMember);
        when(workspaceRepository.findById(10L)).thenReturn(Optional.of(testWorkspace));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(testUser);
        when(chromeExtensionRepository.existsByWorkspaceIdAndNameAndArchivedAtIsNull(10L, "CRM Lead Hunter")).thenReturn(false);
        when(chromeExtensionRepository.save(any(ChromeExtension.class))).thenReturn(testExtension);

        ChromeExtensionResponse response = chromeExtensionService.createExtension(10L, request);

        assertNotNull(response);
        assertEquals("CRM Lead Hunter", response.getName());
        assertEquals("1.0.0", response.getVersion());
        assertEquals(ChromeExtensionStatus.ACTIVE, response.getStatus());
        verify(chromeExtensionRepository).save(any(ChromeExtension.class));
    }

    @Test
    @DisplayName("Create Extension - Duplicate Name Conflict")
    void createExtension_DuplicateName_ThrowsConflictException() {
        CreateChromeExtensionRequest request = CreateChromeExtensionRequest.builder()
                .name("CRM Lead Hunter")
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(adminMember);
        doNothing().when(workspaceAuthService).validateOwnerOrAdmin(adminMember);
        when(workspaceRepository.findById(10L)).thenReturn(Optional.of(testWorkspace));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(testUser);
        when(chromeExtensionRepository.existsByWorkspaceIdAndNameAndArchivedAtIsNull(10L, "CRM Lead Hunter")).thenReturn(true);

        assertThrows(ConflictException.class, () -> chromeExtensionService.createExtension(10L, request));
        verify(chromeExtensionRepository, never()).save(any(ChromeExtension.class));
    }

    @Test
    @DisplayName("Create Extension - Unauthorized User Throws AccessDeniedException")
    void createExtension_Unauthorized_ThrowsAccessDeniedException() {
        CreateChromeExtensionRequest request = CreateChromeExtensionRequest.builder()
                .name("CRM Lead Hunter")
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        doThrow(new AccessDeniedException("Only OWNER or ADMIN can perform this action"))
                .when(workspaceAuthService).validateOwnerOrAdmin(regularMember);

        assertThrows(AccessDeniedException.class, () -> chromeExtensionService.createExtension(10L, request));
    }

    @Test
    @DisplayName("Get Extension - Success")
    void getExtension_Success() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testCaseRepository.countByExtensionId(50L)).thenReturn(3L);

        ChromeExtensionResponse response = chromeExtensionService.getExtension(10L, 50L);

        assertNotNull(response);
        assertEquals(50L, response.getId());
        assertEquals(3L, response.getTestCaseCount());
    }

    @Test
    @DisplayName("Get Extension - Invalid ID Throws ResourceNotFoundException")
    void getExtension_InvalidId_ThrowsResourceNotFoundException() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(999L, 10L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> chromeExtensionService.getExtension(10L, 999L));
    }

    @Test
    @DisplayName("Get Extension - Workspace Isolation Enforced")
    void getExtension_DifferentWorkspace_EnforcesIsolation() {
        // User is in workspace 20, extension is in workspace 10
        when(workspaceAuthService.validateWorkspaceAccess(20L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 20L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> chromeExtensionService.getExtension(20L, 50L));
    }

    @Test
    @DisplayName("List Extensions - Success")
    void listExtensions_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<ChromeExtension> page = new PageImpl<>(List.of(testExtension), pageable, 1);

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByWorkspaceIdAndArchivedAtIsNull(10L, pageable)).thenReturn(page);
        when(testCaseRepository.countByExtensionId(50L)).thenReturn(1L);

        Page<ChromeExtensionResponse> result = chromeExtensionService.listExtensions(10L, null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("CRM Lead Hunter", result.getContent().get(0).getName());
    }

    @Test
    @DisplayName("Update Extension - Success")
    void updateExtension_Success() {
        UpdateChromeExtensionRequest request = UpdateChromeExtensionRequest.builder()
                .name("Updated Extension Name")
                .version("2.0.0")
                .status(ChromeExtensionStatus.ACTIVE)
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(adminMember);
        doNothing().when(workspaceAuthService).validateOwnerOrAdmin(adminMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(chromeExtensionRepository.existsByWorkspaceIdAndNameAndIdNotAndArchivedAtIsNull(10L, "Updated Extension Name", 50L)).thenReturn(false);
        when(chromeExtensionRepository.save(any(ChromeExtension.class))).thenReturn(testExtension);
        when(testCaseRepository.countByExtensionId(50L)).thenReturn(2L);

        ChromeExtensionResponse response = chromeExtensionService.updateExtension(10L, 50L, request);

        assertNotNull(response);
        verify(chromeExtensionRepository).save(testExtension);
    }

    @Test
    @DisplayName("Delete Extension - Soft Deletes by Archiving")
    void deleteExtension_SoftDeletes_ArchivesExtension() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(adminMember);
        doNothing().when(workspaceAuthService).validateOwnerOrAdmin(adminMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(chromeExtensionRepository.save(any(ChromeExtension.class))).thenReturn(testExtension);

        chromeExtensionService.deleteExtension(10L, 50L);

        verify(chromeExtensionRepository).save(argThat(ext ->
                ext.getStatus() == ChromeExtensionStatus.ARCHIVED && ext.getArchivedAt() != null
        ));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test Case Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Create Test Case - Success")
    void createTestCase_Success() {
        CreateTestCaseRequest request = CreateTestCaseRequest.builder()
                .name("Create Lead via API")
                .description("Tests POST /api/leads")
                .testType(TestCaseType.API_CRUD)
                .configuration(Map.of("method", "POST"))
                .expectedResult(Map.of("status", 201))
                .enabled(true)
                .displayOrder(1)
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(adminMember);
        doNothing().when(workspaceAuthService).validateOwnerOrAdmin(adminMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testCaseRepository.save(any(ChromeExtensionTestCase.class))).thenReturn(testCase);

        TestCaseResponse response = chromeExtensionService.createTestCase(10L, 50L, request);

        assertNotNull(response);
        assertEquals("Create Lead via API", response.getName());
        assertEquals(TestCaseType.API_CRUD, response.getTestType());
        assertTrue(response.getEnabled());
        verify(testCaseRepository).save(any(ChromeExtensionTestCase.class));
    }

    @Test
    @DisplayName("Create Test Case - Invalid Extension ID Throws ResourceNotFoundException")
    void createTestCase_InvalidExtensionId_ThrowsResourceNotFoundException() {
        CreateTestCaseRequest request = CreateTestCaseRequest.builder()
                .name("Create Lead")
                .testType(TestCaseType.API_CRUD)
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(adminMember);
        doNothing().when(workspaceAuthService).validateOwnerOrAdmin(adminMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(999L, 10L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> chromeExtensionService.createTestCase(10L, 999L, request));
        verify(testCaseRepository, never()).save(any());
    }

    @Test
    @DisplayName("List Test Cases - Success")
    void listTestCases_Success() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(50L)).thenReturn(List.of(testCase));

        List<TestCaseResponse> responses = chromeExtensionService.listTestCases(10L, 50L);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("Create Lead via API", responses.get(0).getName());
    }

    @Test
    @DisplayName("Get Test Case - Success")
    void getTestCase_Success() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testCaseRepository.findByIdAndExtensionId(200L, 50L)).thenReturn(Optional.of(testCase));

        TestCaseResponse response = chromeExtensionService.getTestCase(10L, 50L, 200L);

        assertNotNull(response);
        assertEquals(200L, response.getId());
        assertEquals("Create Lead via API", response.getName());
    }

    @Test
    @DisplayName("Update Test Case - Success")
    void updateTestCase_Success() {
        UpdateTestCaseRequest request = UpdateTestCaseRequest.builder()
                .name("Updated Test Case")
                .enabled(false)
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(adminMember);
        doNothing().when(workspaceAuthService).validateOwnerOrAdmin(adminMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testCaseRepository.findByIdAndExtensionId(200L, 50L)).thenReturn(Optional.of(testCase));
        when(testCaseRepository.save(any(ChromeExtensionTestCase.class))).thenReturn(testCase);

        TestCaseResponse response = chromeExtensionService.updateTestCase(10L, 50L, 200L, request);

        assertNotNull(response);
        verify(testCaseRepository).save(testCase);
    }

    @Test
    @DisplayName("Delete Test Case - Success")
    void deleteTestCase_Success() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(adminMember);
        doNothing().when(workspaceAuthService).validateOwnerOrAdmin(adminMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testCaseRepository.findByIdAndExtensionId(200L, 50L)).thenReturn(Optional.of(testCase));

        chromeExtensionService.deleteTestCase(10L, 50L, 200L);

        verify(testCaseRepository).delete(testCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test Run Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Create Test Run - Success")
    void createTestRun_Success() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(testUser);
        when(testCaseRepository.countByExtensionIdAndEnabledTrue(50L)).thenReturn(2L);
        when(testRunRepository.findFirstByExtensionIdAndStatusInOrderByCreatedAtDesc(eq(50L), anyCollection())).thenReturn(Optional.empty());

        ChromeExtensionTestRun savedRun = ChromeExtensionTestRun.builder()
                .id(1L)
                .extension(testExtension)
                .triggeredBy(testUser)
                .status(TestRunStatus.QUEUED)
                .totalTests(2)
                .build();

        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenReturn(savedRun);
        doNothing().when(testExecutionService).executeTestRunAsync(eq(10L), eq(testExtension), any(ChromeExtensionTestRun.class), eq(testUser), any());

        TestRunResponse response = chromeExtensionService.createTestRun(10L, 50L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(TestRunStatus.QUEUED, response.getStatus());
        assertEquals(2, response.getTotalTests());
        verify(testRunRepository).save(any(ChromeExtensionTestRun.class));
        verify(testExecutionService).executeTestRunAsync(eq(10L), eq(testExtension), any(ChromeExtensionTestRun.class), eq(testUser), any());
    }

    @Test
    @DisplayName("Create Test Run - Zero Enabled Test Cases Throws IllegalArgumentException")
    void createTestRun_ZeroEnabledTestCases_ThrowsIllegalArgumentException() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(testUser);
        when(testCaseRepository.countByExtensionIdAndEnabledTrue(50L)).thenReturn(0L);

        assertThrows(IllegalArgumentException.class, () -> chromeExtensionService.createTestRun(10L, 50L));
        verify(testRunRepository, never()).save(any());
        verify(testExecutionService, never()).executeTestRunAsync(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Create Test Run - Duplicate Active Run Throws ConflictException")
    void createTestRun_DuplicateActiveRun_ThrowsConflictException() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(testUser);
        when(testCaseRepository.countByExtensionIdAndEnabledTrue(50L)).thenReturn(2L);

        ChromeExtensionTestRun activeRun = ChromeExtensionTestRun.builder()
                .id(99L)
                .extension(testExtension)
                .status(TestRunStatus.RUNNING)
                .build();

        when(testRunRepository.findFirstByExtensionIdAndStatusInOrderByCreatedAtDesc(eq(50L), anyCollection()))
                .thenReturn(Optional.of(activeRun));

        assertThrows(ConflictException.class, () -> chromeExtensionService.createTestRun(10L, 50L));
        verify(testRunRepository, never()).save(any());
    }

    @Test
    @DisplayName("List Test Runs - Success")
    void listTestRuns_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        ChromeExtensionTestRun run = ChromeExtensionTestRun.builder()
                .id(1L)
                .extension(testExtension)
                .status(TestRunStatus.PASSED)
                .totalTests(2)
                .passedTests(2)
                .build();

        Page<ChromeExtensionTestRun> page = new PageImpl<>(List.of(run), pageable, 1);

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testRunRepository.findByExtensionIdOrderByCreatedAtDesc(50L, pageable)).thenReturn(page);

        Page<TestRunResponse> responsePage = chromeExtensionService.listTestRuns(10L, 50L, pageable);

        assertNotNull(responsePage);
        assertEquals(1, responsePage.getTotalElements());
        assertEquals(1L, responsePage.getContent().get(0).getId());
    }

    @Test
    @DisplayName("Get Test Run - Success with Results")
    void getTestRun_Success() {
        ChromeExtensionTestRun run = ChromeExtensionTestRun.builder()
                .id(1L)
                .extension(testExtension)
                .status(TestRunStatus.PASSED)
                .totalTests(1)
                .passedTests(1)
                .build();

        ChromeExtensionTestResult result = ChromeExtensionTestResult.builder()
                .id(10L)
                .testRun(run)
                .testCase(testCase)
                .status(TestResultStatus.PASSED)
                .actualStatusCode(200)
                .executionTimeMs(45)
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testRunRepository.findByIdAndExtensionId(1L, 50L)).thenReturn(Optional.of(run));
        when(testResultRepository.findByTestRunIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(result));

        TestRunResponse response = chromeExtensionService.getTestRun(10L, 50L, 1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertNotNull(response.getResults());
        assertEquals(1, response.getResults().size());
        assertEquals("Create Lead via API", response.getResults().get(0).getTestCaseName());
    }

    @Test
    @DisplayName("Get Test Run - Invalid Run ID Throws ResourceNotFoundException")
    void getTestRun_InvalidId_ThrowsResourceNotFoundException() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testRunRepository.findByIdAndExtensionId(999L, 50L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> chromeExtensionService.getTestRun(10L, 50L, 999L));
    }

    @Test
    @DisplayName("Cancel Test Run - Success")
    void cancelTestRun_Success() {
        ChromeExtensionTestRun run = ChromeExtensionTestRun.builder()
                .id(1L)
                .extension(testExtension)
                .status(TestRunStatus.RUNNING)
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testRunRepository.findByIdAndExtensionId(1L, 50L)).thenReturn(Optional.of(run));
        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenReturn(run);
        when(testResultRepository.findByTestRunIdOrderByCreatedAtAsc(1L)).thenReturn(Collections.emptyList());

        TestRunResponse response = chromeExtensionService.cancelTestRun(10L, 50L, 1L);

        assertNotNull(response);
        assertEquals(TestRunStatus.CANCELLED, response.getStatus());
        verify(testRunRepository).save(run);
    }

    @Test
    @DisplayName("Check Runner Health - Success")
    void checkRunnerHealth_Success() {
        when(runnerClient.checkHealth()).thenReturn(Map.of("status", "UP"));
        Map<String, Object> health = chromeExtensionService.checkRunnerHealth();
        assertNotNull(health);
        assertEquals("UP", health.get("status"));
    }

    @Test
    @DisplayName("Start Browser Run - Success")
    void startBrowserRun_Success() {
        ChromeExtensionTestRun run = ChromeExtensionTestRun.builder()
                .id(100L)
                .extension(testExtension)
                .status(TestRunStatus.QUEUED)
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(testUser);
        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenReturn(run);
        when(runnerClient.startBrowserRun(eq(100L), any(BrowserTestRunRequest.class)))
                .thenReturn(BrowserTestRunResponse.builder().runId(100L).status("QUEUED").build());

        BrowserTestRunResponse response = chromeExtensionService.startBrowserRun(10L, 50L, new BrowserTestRunRequest());
        assertNotNull(response);
        assertEquals(100L, response.getRunId());
        assertEquals("QUEUED", response.getStatus());
    }

    @Test
    @DisplayName("Get Browser Run Status - Success")
    void getBrowserRunStatus_Success() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testRunRepository.findByIdAndExtensionId(100L, 50L)).thenReturn(Optional.empty());
        when(runnerClient.getBrowserRunStatus(100L))
                .thenReturn(BrowserTestRunResponse.builder().runId(100L).status("PASSED").totalTests(3).passedTests(3).build());

        BrowserTestRunResponse response = chromeExtensionService.getBrowserRunStatus(10L, 50L, 100L);
        assertNotNull(response);
        assertEquals(100L, response.getRunId());
        assertEquals("PASSED", response.getStatus());
    }

    @Test
    @DisplayName("Cancel Browser Run - Success")
    void cancelBrowserRun_Success() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testRunRepository.findByIdAndExtensionId(100L, 50L)).thenReturn(Optional.empty());
        when(runnerClient.cancelBrowserRun(100L))
                .thenReturn(BrowserTestRunResponse.builder().runId(100L).status("CANCELLED").build());

        BrowserTestRunResponse response = chromeExtensionService.cancelBrowserRun(10L, 50L, 100L);
        assertNotNull(response);
        assertEquals(100L, response.getRunId());
        assertEquals("CANCELLED", response.getStatus());
    }

    @Test
    @DisplayName("Get Artifact - Success")
    void getArtifact_Success() {
        ChromeExtensionTestRun run = ChromeExtensionTestRun.builder()
                .id(100L)
                .extension(testExtension)
                .build();
        byte[] dummyPng = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testRunRepository.findByIdAndExtensionId(100L, 50L)).thenReturn(Optional.of(run));
        when(runnerClient.getArtifact(100L, "shot.png")).thenReturn(dummyPng);

        byte[] result = chromeExtensionService.getArtifact(10L, 50L, 100L, "shot.png");
        assertNotNull(result);
        assertArrayEquals(dummyPng, result);
    }

    @Test
    @DisplayName("Get Artifact - Traversal / Invalid Filename Rejected")
    void getArtifact_InvalidFilename() {
        ChromeExtensionTestRun run = ChromeExtensionTestRun.builder()
                .id(100L)
                .extension(testExtension)
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(regularMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(50L, 10L)).thenReturn(Optional.of(testExtension));
        when(testRunRepository.findByIdAndExtensionId(100L, 50L)).thenReturn(Optional.of(run));

        assertThrows(IllegalArgumentException.class, () ->
                chromeExtensionService.getArtifact(10L, 50L, 100L, "../traversal.png"));
        assertThrows(IllegalArgumentException.class, () ->
                chromeExtensionService.getArtifact(10L, 50L, 100L, "secrets.txt"));
    }
}
