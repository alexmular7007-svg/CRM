package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.CreateChromeExtensionRequest;
import com.arjun.crm.dto.request.CreateTestCaseRequest;
import com.arjun.crm.dto.request.UpdateChromeExtensionRequest;
import com.arjun.crm.dto.request.UpdateTestCaseRequest;
import com.arjun.crm.dto.response.ChromeExtensionResponse;
import com.arjun.crm.dto.response.TestCaseResponse;
import com.arjun.crm.entity.ChromeExtension;
import com.arjun.crm.entity.ChromeExtensionTestCase;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.ChromeExtensionStatus;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.ChromeExtensionRepository;
import com.arjun.crm.repository.ChromeExtensionTestCaseRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.ChromeExtensionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChromeExtensionServiceImpl implements ChromeExtensionService {

    private final ChromeExtensionRepository chromeExtensionRepository;
    private final ChromeExtensionTestCaseRepository testCaseRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;

    // ─────────────────────────────────────────────────────────────────────────
    // Extension CRUD
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public ChromeExtensionResponse createExtension(Long workspaceId, CreateChromeExtensionRequest request) {
        log.info("Creating Chrome Extension '{}' in workspace: {}", request.getName(), workspaceId);

        // Security check: Must be OWNER or ADMIN of workspace
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        User currentUser = workspaceAuthService.getAuthenticatedUser();

        // Check for duplicate name in the same workspace
        if (chromeExtensionRepository.existsByWorkspaceIdAndNameAndArchivedAtIsNull(workspaceId, request.getName().trim())) {
            throw new ConflictException("Chrome Extension with name '" + request.getName().trim() + "' already exists in this workspace");
        }

        ChromeExtension extension = ChromeExtension.builder()
                .workspace(workspace)
                .name(request.getName().trim())
                .description(request.getDescription())
                .version(request.getVersion() != null && !request.getVersion().isBlank() ? request.getVersion().trim() : "1.0.0")
                .status(request.getStatus() != null ? request.getStatus() : ChromeExtensionStatus.ACTIVE)
                .manifestJson(request.getManifestJson())
                .createdBy(currentUser)
                .build();

        extension = chromeExtensionRepository.save(extension);
        log.info("Chrome Extension created with ID: {}", extension.getId());
        return mapToExtensionResponse(extension, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChromeExtensionResponse> listExtensions(Long workspaceId, String search, Pageable pageable) {
        log.info("Listing Chrome Extensions for workspace: {}, search: {}", workspaceId, search);

        // Read permission: Any member of the workspace
        workspaceAuthService.validateWorkspaceAccess(workspaceId);

        Page<ChromeExtension> page;
        if (search != null && !search.isBlank()) {
            page = chromeExtensionRepository.findByWorkspaceIdAndNameContainingIgnoreCaseAndArchivedAtIsNull(
                    workspaceId, search.trim(), pageable);
        } else {
            page = chromeExtensionRepository.findByWorkspaceIdAndArchivedAtIsNull(workspaceId, pageable);
        }

        return page.map(ext -> {
            long testCaseCount = testCaseRepository.countByExtensionId(ext.getId());
            return mapToExtensionResponse(ext, testCaseCount);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public ChromeExtensionResponse getExtension(Long workspaceId, Long extensionId) {
        log.info("Getting Chrome Extension ID: {} for workspace: {}", extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);

        ChromeExtension extension = getValidExtension(workspaceId, extensionId);
        long testCaseCount = testCaseRepository.countByExtensionId(extension.getId());
        return mapToExtensionResponse(extension, testCaseCount);
    }

    @Override
    public ChromeExtensionResponse updateExtension(Long workspaceId, Long extensionId, UpdateChromeExtensionRequest request) {
        log.info("Updating Chrome Extension ID: {} for workspace: {}", extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        ChromeExtension extension = getValidExtension(workspaceId, extensionId);

        if (request.getName() != null && !request.getName().isBlank()) {
            String newName = request.getName().trim();
            if (chromeExtensionRepository.existsByWorkspaceIdAndNameAndIdNotAndArchivedAtIsNull(workspaceId, newName, extensionId)) {
                throw new ConflictException("Chrome Extension with name '" + newName + "' already exists in this workspace");
            }
            extension.setName(newName);
        }

        if (request.getDescription() != null) {
            extension.setDescription(request.getDescription());
        }

        if (request.getVersion() != null && !request.getVersion().isBlank()) {
            extension.setVersion(request.getVersion().trim());
        }

        if (request.getStatus() != null) {
            extension.setStatus(request.getStatus());
        }

        if (request.getManifestJson() != null) {
            extension.setManifestJson(request.getManifestJson());
        }

        extension = chromeExtensionRepository.save(extension);
        long testCaseCount = testCaseRepository.countByExtensionId(extension.getId());
        return mapToExtensionResponse(extension, testCaseCount);
    }

    @Override
    public void deleteExtension(Long workspaceId, Long extensionId) {
        log.info("Deleting (archiving) Chrome Extension ID: {} in workspace: {}", extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        ChromeExtension extension = getValidExtension(workspaceId, extensionId);
        extension.setArchivedAt(LocalDateTime.now());
        extension.setStatus(ChromeExtensionStatus.ARCHIVED);
        chromeExtensionRepository.save(extension);
        log.info("Chrome Extension ID: {} successfully archived", extensionId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test Case CRUD
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public TestCaseResponse createTestCase(Long workspaceId, Long extensionId, CreateTestCaseRequest request) {
        log.info("Creating test case '{}' for extension ID: {} in workspace: {}", request.getName(), extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        ChromeExtension extension = getValidExtension(workspaceId, extensionId);

        ChromeExtensionTestCase testCase = ChromeExtensionTestCase.builder()
                .extension(extension)
                .name(request.getName().trim())
                .description(request.getDescription())
                .testType(request.getTestType())
                .configuration(request.getConfiguration())
                .expectedResult(request.getExpectedResult())
                .enabled(request.getEnabled() != null ? request.getEnabled() : true)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        testCase = testCaseRepository.save(testCase);
        log.info("Test case created with ID: {}", testCase.getId());
        return mapToTestCaseResponse(testCase);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TestCaseResponse> listTestCases(Long workspaceId, Long extensionId) {
        log.info("Listing test cases for extension ID: {} in workspace: {}", extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);

        return testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(extensionId)
                .stream()
                .map(this::mapToTestCaseResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TestCaseResponse getTestCase(Long workspaceId, Long extensionId, Long testCaseId) {
        log.info("Getting test case ID: {} for extension ID: {} in workspace: {}", testCaseId, extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);

        ChromeExtensionTestCase testCase = testCaseRepository.findByIdAndExtensionId(testCaseId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test case not found with ID: " + testCaseId));

        return mapToTestCaseResponse(testCase);
    }

    @Override
    public TestCaseResponse updateTestCase(Long workspaceId, Long extensionId, Long testCaseId, UpdateTestCaseRequest request) {
        log.info("Updating test case ID: {} for extension ID: {} in workspace: {}", testCaseId, extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        getValidExtension(workspaceId, extensionId);

        ChromeExtensionTestCase testCase = testCaseRepository.findByIdAndExtensionId(testCaseId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test case not found with ID: " + testCaseId));

        if (request.getName() != null && !request.getName().isBlank()) {
            testCase.setName(request.getName().trim());
        }

        if (request.getDescription() != null) {
            testCase.setDescription(request.getDescription());
        }

        if (request.getTestType() != null) {
            testCase.setTestType(request.getTestType());
        }

        if (request.getConfiguration() != null) {
            testCase.setConfiguration(request.getConfiguration());
        }

        if (request.getExpectedResult() != null) {
            testCase.setExpectedResult(request.getExpectedResult());
        }

        if (request.getEnabled() != null) {
            testCase.setEnabled(request.getEnabled());
        }

        if (request.getDisplayOrder() != null) {
            testCase.setDisplayOrder(request.getDisplayOrder());
        }

        testCase = testCaseRepository.save(testCase);
        return mapToTestCaseResponse(testCase);
    }

    @Override
    public void deleteTestCase(Long workspaceId, Long extensionId, Long testCaseId) {
        log.info("Deleting test case ID: {} for extension ID: {} in workspace: {}", testCaseId, extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        getValidExtension(workspaceId, extensionId);

        ChromeExtensionTestCase testCase = testCaseRepository.findByIdAndExtensionId(testCaseId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test case not found with ID: " + testCaseId));

        testCaseRepository.delete(testCase);
        log.info("Test case ID: {} successfully deleted", testCaseId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper Methods
    // ─────────────────────────────────────────────────────────────────────────

    private ChromeExtension getValidExtension(Long workspaceId, Long extensionId) {
        return chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(extensionId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Chrome Extension not found with ID: " + extensionId + " in this workspace"));
    }

    private ChromeExtensionResponse mapToExtensionResponse(ChromeExtension ext, long testCaseCount) {
        return ChromeExtensionResponse.builder()
                .id(ext.getId())
                .workspaceId(ext.getWorkspace() != null ? ext.getWorkspace().getId() : null)
                .name(ext.getName())
                .description(ext.getDescription())
                .version(ext.getVersion())
                .status(ext.getStatus())
                .manifestJson(ext.getManifestJson())
                .createdById(ext.getCreatedBy() != null ? ext.getCreatedBy().getId() : null)
                .createdByName(ext.getCreatedBy() != null ? (ext.getCreatedBy().getFirstName() + " " + ext.getCreatedBy().getLastName()).trim() : null)
                .testCaseCount(testCaseCount)
                .createdAt(ext.getCreatedAt())
                .updatedAt(ext.getUpdatedAt())
                .build();
    }

    private TestCaseResponse mapToTestCaseResponse(ChromeExtensionTestCase tc) {
        return TestCaseResponse.builder()
                .id(tc.getId())
                .extensionId(tc.getExtension() != null ? tc.getExtension().getId() : null)
                .name(tc.getName())
                .description(tc.getDescription())
                .testType(tc.getTestType())
                .configuration(tc.getConfiguration())
                .expectedResult(tc.getExpectedResult())
                .enabled(tc.getEnabled())
                .displayOrder(tc.getDisplayOrder())
                .createdAt(tc.getCreatedAt())
                .updatedAt(tc.getUpdatedAt())
                .build();
    }
}
