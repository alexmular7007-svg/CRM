package com.arjun.crm.service;

import com.arjun.crm.dto.request.CreateTestSuiteRequest;
import com.arjun.crm.dto.request.TestSuiteItemRequest;
import com.arjun.crm.dto.request.UpdateTestSuiteRequest;
import com.arjun.crm.dto.response.TestSuiteResponse;
import com.arjun.crm.entity.*;
import com.arjun.crm.enums.ChromeExtensionStatus;
import com.arjun.crm.enums.TestCaseType;
import com.arjun.crm.enums.WorkspaceRole;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.ChromeExtensionRepository;
import com.arjun.crm.repository.ChromeExtensionTestCaseRepository;
import com.arjun.crm.repository.ChromeExtensionTestSuiteItemRepository;
import com.arjun.crm.repository.ChromeExtensionTestSuiteRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.impl.ChromeExtensionTestSuiteServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChromeExtensionTestSuiteServiceTest {

    @Mock
    private ChromeExtensionTestSuiteRepository testSuiteRepository;

    @Mock
    private ChromeExtensionTestSuiteItemRepository testSuiteItemRepository;

    @Mock
    private ChromeExtensionTestCaseRepository testCaseRepository;

    @Mock
    private ChromeExtensionRepository chromeExtensionRepository;

    @Mock
    private WorkspaceAuthorizationService workspaceAuthService;

    @InjectMocks
    private ChromeExtensionTestSuiteServiceImpl testSuiteService;

    private Workspace sampleWorkspace;
    private ChromeExtension sampleExtension;
    private ChromeExtension otherExtension;
    private User sampleUser;
    private WorkspaceMember sampleMember;
    private ChromeExtensionTestCase testCase1;
    private ChromeExtensionTestCase testCase2;
    private ChromeExtensionTestCase otherExtTestCase;
    private ChromeExtensionTestSuite sampleSuite;

    @BeforeEach
    void setUp() {
        sampleWorkspace = Workspace.builder().id(10L).name("Test Workspace").build();

        sampleUser = User.builder().id(1L).email("admin@example.com").firstName("Admin").lastName("User").build();

        sampleMember = WorkspaceMember.builder()
                .id(100L)
                .workspace(sampleWorkspace)
                .user(sampleUser)
                .role(WorkspaceRole.ADMIN)
                .build();

        sampleExtension = ChromeExtension.builder()
                .id(1L)
                .workspace(sampleWorkspace)
                .name("CRM Extension")
                .status(ChromeExtensionStatus.ACTIVE)
                .createdBy(sampleUser)
                .build();

        otherExtension = ChromeExtension.builder()
                .id(2L)
                .workspace(sampleWorkspace)
                .name("Other Extension")
                .status(ChromeExtensionStatus.ACTIVE)
                .createdBy(sampleUser)
                .build();

        testCase1 = ChromeExtensionTestCase.builder()
                .id(101L)
                .extension(sampleExtension)
                .name("API Login Test")
                .testType(TestCaseType.API_CRUD)
                .enabled(true)
                .build();

        testCase2 = ChromeExtensionTestCase.builder()
                .id(102L)
                .extension(sampleExtension)
                .name("Browser Popup Test")
                .testType(TestCaseType.BROWSER)
                .enabled(true)
                .build();

        otherExtTestCase = ChromeExtensionTestCase.builder()
                .id(201L)
                .extension(otherExtension)
                .name("Other Extension Test")
                .testType(TestCaseType.API_CRUD)
                .enabled(true)
                .build();

        sampleSuite = ChromeExtensionTestSuite.builder()
                .id(500L)
                .extension(sampleExtension)
                .name("Full Smoke Suite")
                .description("Runs API and Browser tests")
                .stopOnFailure(true)
                .enabled(true)
                .createdBy(sampleUser)
                .items(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("1. Create Test Suite successfully with ordered items")
    void createSuite_Success() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L))
                .thenReturn(Optional.of(sampleExtension));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(sampleUser);
        when(testSuiteRepository.existsByExtensionIdAndNameIgnoreCase(1L, "Full Smoke Suite")).thenReturn(false);

        when(testCaseRepository.findByIdAndExtensionId(101L, 1L)).thenReturn(Optional.of(testCase1));
        when(testCaseRepository.findByIdAndExtensionId(102L, 1L)).thenReturn(Optional.of(testCase2));

        when(testSuiteRepository.save(any(ChromeExtensionTestSuite.class))).thenAnswer(invocation -> {
            ChromeExtensionTestSuite s = invocation.getArgument(0);
            if (s.getId() == null) s.setId(500L);
            return s;
        });

        CreateTestSuiteRequest request = CreateTestSuiteRequest.builder()
                .name("Full Smoke Suite")
                .description("Runs API and Browser tests")
                .stopOnFailure(true)
                .enabled(true)
                .items(List.of(
                        TestSuiteItemRequest.builder().testCaseId(101L).executionOrder(0).enabled(true).build(),
                        TestSuiteItemRequest.builder().testCaseId(102L).executionOrder(1).enabled(true).build()
                ))
                .build();

        TestSuiteResponse response = testSuiteService.createSuite(10L, 1L, request);

        assertNotNull(response);
        assertEquals(500L, response.getId());
        assertEquals("Full Smoke Suite", response.getName());
        assertTrue(response.getStopOnFailure());
        assertEquals(2, response.getItems().size());
        assertEquals(101L, response.getItems().get(0).getTestCaseId());
        assertEquals(102L, response.getItems().get(1).getTestCaseId());

        verify(testSuiteRepository, atLeastOnce()).save(any(ChromeExtensionTestSuite.class));
    }

    @Test
    @DisplayName("2. Create Test Suite throws ConflictException on duplicate name")
    void createSuite_DuplicateName_ThrowsConflict() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L))
                .thenReturn(Optional.of(sampleExtension));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(sampleUser);
        when(testSuiteRepository.existsByExtensionIdAndNameIgnoreCase(1L, "Full Smoke Suite")).thenReturn(true);

        CreateTestSuiteRequest request = CreateTestSuiteRequest.builder()
                .name("Full Smoke Suite")
                .build();

        assertThrows(ConflictException.class, () -> testSuiteService.createSuite(10L, 1L, request));
    }

    @Test
    @DisplayName("3. Create Test Suite throws ResourceNotFoundException for nonexistent extension")
    void createSuite_NonexistentExtension_ThrowsNotFound() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(999L, 10L))
                .thenReturn(Optional.empty());

        CreateTestSuiteRequest request = CreateTestSuiteRequest.builder()
                .name("Suite 1")
                .build();

        assertThrows(ResourceNotFoundException.class, () -> testSuiteService.createSuite(10L, 999L, request));
    }

    @Test
    @DisplayName("4. Create Test Suite throws ResourceNotFoundException for nonexistent test case")
    void createSuite_NonexistentTestCase_ThrowsNotFound() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L))
                .thenReturn(Optional.of(sampleExtension));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(sampleUser);
        when(testSuiteRepository.existsByExtensionIdAndNameIgnoreCase(1L, "Suite 1")).thenReturn(false);
        when(testCaseRepository.findByIdAndExtensionId(999L, 1L)).thenReturn(Optional.empty());

        when(testSuiteRepository.save(any(ChromeExtensionTestSuite.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateTestSuiteRequest request = CreateTestSuiteRequest.builder()
                .name("Suite 1")
                .items(List.of(
                        TestSuiteItemRequest.builder().testCaseId(999L).executionOrder(0).build()
                ))
                .build();

        assertThrows(ResourceNotFoundException.class, () -> testSuiteService.createSuite(10L, 1L, request));
    }

    @Test
    @DisplayName("5. Create Test Suite rejects test case from another extension (Cross-Extension Protection)")
    void createSuite_CrossExtensionTestCase_ThrowsNotFound() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L))
                .thenReturn(Optional.of(sampleExtension));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(sampleUser);
        when(testSuiteRepository.existsByExtensionIdAndNameIgnoreCase(1L, "Suite 1")).thenReturn(false);
        // findByIdAndExtensionId for other extension's case under extension 1 returns empty
        when(testCaseRepository.findByIdAndExtensionId(201L, 1L)).thenReturn(Optional.empty());

        when(testSuiteRepository.save(any(ChromeExtensionTestSuite.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateTestSuiteRequest request = CreateTestSuiteRequest.builder()
                .name("Suite 1")
                .items(List.of(
                        TestSuiteItemRequest.builder().testCaseId(201L).executionOrder(0).build()
                ))
                .build();

        assertThrows(ResourceNotFoundException.class, () -> testSuiteService.createSuite(10L, 1L, request));
    }

    @Test
    @DisplayName("6. Create Test Suite rejects duplicate test case ID in same suite")
    void createSuite_DuplicateTestCaseId_ThrowsBadRequest() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L))
                .thenReturn(Optional.of(sampleExtension));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(sampleUser);
        when(testSuiteRepository.existsByExtensionIdAndNameIgnoreCase(1L, "Suite 1")).thenReturn(false);
        when(testCaseRepository.findByIdAndExtensionId(101L, 1L)).thenReturn(Optional.of(testCase1));

        when(testSuiteRepository.save(any(ChromeExtensionTestSuite.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateTestSuiteRequest request = CreateTestSuiteRequest.builder()
                .name("Suite 1")
                .items(List.of(
                        TestSuiteItemRequest.builder().testCaseId(101L).executionOrder(0).build(),
                        TestSuiteItemRequest.builder().testCaseId(101L).executionOrder(1).build()
                ))
                .build();

        assertThrows(IllegalArgumentException.class, () -> testSuiteService.createSuite(10L, 1L, request));
    }

    @Test
    @DisplayName("7. Create Test Suite rejects duplicate execution order")
    void createSuite_DuplicateExecutionOrder_ThrowsBadRequest() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L))
                .thenReturn(Optional.of(sampleExtension));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(sampleUser);
        when(testSuiteRepository.existsByExtensionIdAndNameIgnoreCase(1L, "Suite 1")).thenReturn(false);
        when(testCaseRepository.findByIdAndExtensionId(101L, 1L)).thenReturn(Optional.of(testCase1));
        when(testCaseRepository.findByIdAndExtensionId(102L, 1L)).thenReturn(Optional.of(testCase2));

        when(testSuiteRepository.save(any(ChromeExtensionTestSuite.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateTestSuiteRequest request = CreateTestSuiteRequest.builder()
                .name("Suite 1")
                .items(List.of(
                        TestSuiteItemRequest.builder().testCaseId(101L).executionOrder(0).build(),
                        TestSuiteItemRequest.builder().testCaseId(102L).executionOrder(0).build()
                ))
                .build();

        assertThrows(IllegalArgumentException.class, () -> testSuiteService.createSuite(10L, 1L, request));
    }

    @Test
    @DisplayName("8. List Test Suites for extension")
    void listSuites_Success() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L))
                .thenReturn(Optional.of(sampleExtension));
        when(testSuiteRepository.findByExtensionIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(sampleSuite));

        List<TestSuiteResponse> responses = testSuiteService.listSuites(10L, 1L);

        assertEquals(1, responses.size());
        assertEquals("Full Smoke Suite", responses.get(0).getName());
    }

    @Test
    @DisplayName("9. Get Test Suite by ID successfully")
    void getSuite_Success() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L))
                .thenReturn(Optional.of(sampleExtension));
        when(testSuiteRepository.findByIdAndExtensionId(500L, 1L)).thenReturn(Optional.of(sampleSuite));

        TestSuiteResponse response = testSuiteService.getSuite(10L, 1L, 500L);

        assertNotNull(response);
        assertEquals(500L, response.getId());
        assertEquals("Full Smoke Suite", response.getName());
    }

    @Test
    @DisplayName("10. Get Test Suite throws ResourceNotFoundException for nonexistent suite")
    void getSuite_Nonexistent_ThrowsNotFound() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L))
                .thenReturn(Optional.of(sampleExtension));
        when(testSuiteRepository.findByIdAndExtensionId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> testSuiteService.getSuite(10L, 1L, 999L));
    }

    @Test
    @DisplayName("11. Update Test Suite successfully")
    void updateSuite_Success() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L))
                .thenReturn(Optional.of(sampleExtension));
        when(testSuiteRepository.findByIdAndExtensionId(500L, 1L)).thenReturn(Optional.of(sampleSuite));
        when(testSuiteRepository.existsByExtensionIdAndNameIgnoreCaseAndIdNot(1L, "Updated Suite", 500L)).thenReturn(false);
        when(testCaseRepository.findByIdAndExtensionId(101L, 1L)).thenReturn(Optional.of(testCase1));
        when(testSuiteRepository.save(any(ChromeExtensionTestSuite.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateTestSuiteRequest request = UpdateTestSuiteRequest.builder()
                .name("Updated Suite")
                .description("Updated description")
                .stopOnFailure(false)
                .enabled(false)
                .items(List.of(
                        TestSuiteItemRequest.builder().testCaseId(101L).executionOrder(0).enabled(true).build()
                ))
                .build();

        TestSuiteResponse response = testSuiteService.updateSuite(10L, 1L, 500L, request);

        assertNotNull(response);
        assertEquals("Updated Suite", response.getName());
        assertEquals("Updated description", response.getDescription());
        assertFalse(response.getStopOnFailure());
        assertFalse(response.getEnabled());
        assertEquals(1, response.getItems().size());
    }

    @Test
    @DisplayName("12. Update Test Suite throws ConflictException on duplicate name")
    void updateSuite_DuplicateName_ThrowsConflict() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L))
                .thenReturn(Optional.of(sampleExtension));
        when(testSuiteRepository.findByIdAndExtensionId(500L, 1L)).thenReturn(Optional.of(sampleSuite));
        when(testSuiteRepository.existsByExtensionIdAndNameIgnoreCaseAndIdNot(1L, "Existing Suite", 500L)).thenReturn(true);

        UpdateTestSuiteRequest request = UpdateTestSuiteRequest.builder()
                .name("Existing Suite")
                .build();

        assertThrows(ConflictException.class, () -> testSuiteService.updateSuite(10L, 1L, 500L, request));
    }

    @Test
    @DisplayName("13. Delete Test Suite successfully")
    void deleteSuite_Success() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L))
                .thenReturn(Optional.of(sampleExtension));
        when(testSuiteRepository.findByIdAndExtensionId(500L, 1L)).thenReturn(Optional.of(sampleSuite));

        testSuiteService.deleteSuite(10L, 1L, 500L);

        verify(testSuiteRepository, times(1)).delete(sampleSuite);
    }

    @Test
    @DisplayName("14. Workspace authorization rejects non-admin users for suite mutations")
    void workspaceAuth_Forbidden() {
        WorkspaceMember viewerMember = WorkspaceMember.builder()
                .id(101L)
                .workspace(sampleWorkspace)
                .user(sampleUser)
                .role(WorkspaceRole.MEMBER)
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(viewerMember);
        doThrow(new AccessDeniedException("Only workspace owner or admin can perform this action"))
                .when(workspaceAuthService).validateOwnerOrAdmin(viewerMember);

        CreateTestSuiteRequest request = CreateTestSuiteRequest.builder().name("Unauthorized Suite").build();

        assertThrows(AccessDeniedException.class, () -> testSuiteService.createSuite(10L, 1L, request));
    }
}
