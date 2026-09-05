package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.CreateTestSuiteRequest;
import com.arjun.crm.dto.request.TestSuiteItemRequest;
import com.arjun.crm.dto.request.UpdateTestSuiteRequest;
import com.arjun.crm.dto.response.TestSuiteItemResponse;
import com.arjun.crm.dto.response.TestSuiteResponse;
import com.arjun.crm.entity.*;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.ChromeExtensionRepository;
import com.arjun.crm.repository.ChromeExtensionTestCaseRepository;
import com.arjun.crm.repository.ChromeExtensionTestSuiteItemRepository;
import com.arjun.crm.repository.ChromeExtensionTestSuiteRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.ChromeExtensionTestSuiteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChromeExtensionTestSuiteServiceImpl implements ChromeExtensionTestSuiteService {

    private final ChromeExtensionTestSuiteRepository testSuiteRepository;
    private final ChromeExtensionTestSuiteItemRepository testSuiteItemRepository;
    private final ChromeExtensionTestCaseRepository testCaseRepository;
    private final ChromeExtensionRepository chromeExtensionRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;

    @Override
    public TestSuiteResponse createSuite(Long workspaceId, Long extensionId, CreateTestSuiteRequest request) {
        log.info("Creating Test Suite '{}' for extension ID: {} in workspace: {}", request.getName(), extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        ChromeExtension extension = getValidExtension(workspaceId, extensionId);
        User currentUser = workspaceAuthService.getAuthenticatedUser();

        String trimmedName = request.getName().trim();
        if (testSuiteRepository.existsByExtensionIdAndNameIgnoreCase(extensionId, trimmedName)) {
            throw new ConflictException("Test suite with name '" + trimmedName + "' already exists for this extension");
        }

        ChromeExtensionTestSuite suite = ChromeExtensionTestSuite.builder()
                .extension(extension)
                .name(trimmedName)
                .description(request.getDescription())
                .stopOnFailure(Boolean.TRUE.equals(request.getStopOnFailure()))
                .enabled(request.getEnabled() != null ? request.getEnabled() : true)
                .createdBy(currentUser)
                .items(new ArrayList<>())
                .build();

        suite = testSuiteRepository.save(suite);

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            List<ChromeExtensionTestSuiteItem> items = validateAndBuildItems(suite, extensionId, request.getItems());
            suite.getItems().addAll(items);
            suite = testSuiteRepository.save(suite);
        }

        log.info("Test Suite created with ID: {} for extension ID: {}", suite.getId(), extensionId);
        return mapToTestSuiteResponse(suite);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TestSuiteResponse> listSuites(Long workspaceId, Long extensionId) {
        log.info("Listing Test Suites for extension ID: {} in workspace: {}", extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);

        List<ChromeExtensionTestSuite> suites = testSuiteRepository.findByExtensionIdOrderByCreatedAtDesc(extensionId);
        return suites.stream()
                .map(this::mapToTestSuiteResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TestSuiteResponse getSuite(Long workspaceId, Long extensionId, Long suiteId) {
        log.info("Getting Test Suite ID: {} for extension ID: {} in workspace: {}", suiteId, extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);

        ChromeExtensionTestSuite suite = getValidSuite(extensionId, suiteId);
        return mapToTestSuiteResponse(suite);
    }

    @Override
    public TestSuiteResponse updateSuite(Long workspaceId, Long extensionId, Long suiteId, UpdateTestSuiteRequest request) {
        log.info("Updating Test Suite ID: {} for extension ID: {} in workspace: {}", suiteId, extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        getValidExtension(workspaceId, extensionId);
        ChromeExtensionTestSuite suite = getValidSuite(extensionId, suiteId);

        if (request.getName() != null && !request.getName().isBlank()) {
            String newName = request.getName().trim();
            if (testSuiteRepository.existsByExtensionIdAndNameIgnoreCaseAndIdNot(extensionId, newName, suiteId)) {
                throw new ConflictException("Test suite with name '" + newName + "' already exists for this extension");
            }
            suite.setName(newName);
        }

        if (request.getDescription() != null) {
            suite.setDescription(request.getDescription());
        }

        if (request.getStopOnFailure() != null) {
            suite.setStopOnFailure(request.getStopOnFailure());
        }

        if (request.getEnabled() != null) {
            suite.setEnabled(request.getEnabled());
        }

        if (request.getItems() != null) {
            suite.getItems().clear();
            testSuiteRepository.saveAndFlush(suite);

            List<ChromeExtensionTestSuiteItem> items = validateAndBuildItems(suite, extensionId, request.getItems());
            suite.getItems().addAll(items);
        }

        suite = testSuiteRepository.save(suite);
        log.info("Test Suite ID: {} updated successfully", suiteId);
        return mapToTestSuiteResponse(suite);
    }

    @Override
    public void deleteSuite(Long workspaceId, Long extensionId, Long suiteId) {
        log.info("Deleting Test Suite ID: {} for extension ID: {} in workspace: {}", suiteId, extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        getValidExtension(workspaceId, extensionId);
        ChromeExtensionTestSuite suite = getValidSuite(extensionId, suiteId);

        testSuiteRepository.delete(suite);
        log.info("Test Suite ID: {} successfully deleted", suiteId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper Methods & Ownership Validation
    // ─────────────────────────────────────────────────────────────────────────

    private ChromeExtension getValidExtension(Long workspaceId, Long extensionId) {
        return chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(extensionId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Chrome Extension not found with ID: " + extensionId + " in this workspace"));
    }

    private ChromeExtensionTestSuite getValidSuite(Long extensionId, Long suiteId) {
        return testSuiteRepository.findByIdAndExtensionId(suiteId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test suite not found with ID: " + suiteId + " for this extension"));
    }

    /**
     * Validates that all test cases exist and strictly belong to the specified extension,
     * ensuring no cross-workspace or cross-extension test cases can be injected into a suite.
     * Also validates that execution orders and test case IDs are unique within the suite.
     */
    private List<ChromeExtensionTestSuiteItem> validateAndBuildItems(
            ChromeExtensionTestSuite suite,
            Long extensionId,
            List<TestSuiteItemRequest> itemRequests
    ) {
        List<ChromeExtensionTestSuiteItem> items = new ArrayList<>();
        Set<Long> seenCaseIds = new HashSet<>();
        Set<Integer> seenOrders = new HashSet<>();

        for (int i = 0; i < itemRequests.size(); i++) {
            TestSuiteItemRequest req = itemRequests.get(i);
            if (req.getTestCaseId() == null) {
                throw new IllegalArgumentException("testCaseId is required for suite item at position " + i);
            }

            // Reject duplicate test case in same suite
            if (!seenCaseIds.add(req.getTestCaseId())) {
                throw new IllegalArgumentException("Duplicate testCaseId " + req.getTestCaseId() + " in suite items");
            }

            // Verify test case exists and belongs strictly to this extension
            ChromeExtensionTestCase testCase = testCaseRepository.findByIdAndExtensionId(req.getTestCaseId(), extensionId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Test case not found with ID: " + req.getTestCaseId() + " for extension ID: " + extensionId));

            int order = req.getExecutionOrder() != null ? req.getExecutionOrder() : i;
            if (!seenOrders.add(order)) {
                throw new IllegalArgumentException("Duplicate executionOrder " + order + " in suite items");
            }

            ChromeExtensionTestSuiteItem item = ChromeExtensionTestSuiteItem.builder()
                    .suite(suite)
                    .testCase(testCase)
                    .executionOrder(order)
                    .enabled(req.getEnabled() != null ? req.getEnabled() : true)
                    .build();

            items.add(item);
        }

        return items;
    }

    private TestSuiteResponse mapToTestSuiteResponse(ChromeExtensionTestSuite suite) {
        List<TestSuiteItemResponse> itemResponses = suite.getItems() != null
                ? suite.getItems().stream()
                .sorted(Comparator.comparingInt(ChromeExtensionTestSuiteItem::getExecutionOrder))
                .map(this::mapToTestSuiteItemResponse)
                .collect(Collectors.toList())
                : Collections.emptyList();

        return TestSuiteResponse.builder()
                .id(suite.getId())
                .workspaceId(suite.getExtension() != null && suite.getExtension().getWorkspace() != null
                        ? suite.getExtension().getWorkspace().getId() : null)
                .extensionId(suite.getExtension() != null ? suite.getExtension().getId() : null)
                .extensionName(suite.getExtension() != null ? suite.getExtension().getName() : null)
                .name(suite.getName())
                .description(suite.getDescription())
                .stopOnFailure(suite.getStopOnFailure())
                .enabled(suite.getEnabled())
                .createdById(suite.getCreatedBy() != null ? suite.getCreatedBy().getId() : null)
                .createdByName(suite.getCreatedBy() != null
                        ? (suite.getCreatedBy().getFirstName() + " " + suite.getCreatedBy().getLastName()).trim() : null)
                .totalItems(itemResponses.size())
                .items(itemResponses)
                .createdAt(suite.getCreatedAt())
                .updatedAt(suite.getUpdatedAt())
                .build();
    }

    private TestSuiteItemResponse mapToTestSuiteItemResponse(ChromeExtensionTestSuiteItem item) {
        return TestSuiteItemResponse.builder()
                .id(item.getId())
                .suiteId(item.getSuite() != null ? item.getSuite().getId() : null)
                .testCaseId(item.getTestCase() != null ? item.getTestCase().getId() : null)
                .testCaseName(item.getTestCase() != null ? item.getTestCase().getName() : null)
                .testCaseType(item.getTestCase() != null ? item.getTestCase().getTestType() : null)
                .executionOrder(item.getExecutionOrder())
                .enabled(item.getEnabled())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
