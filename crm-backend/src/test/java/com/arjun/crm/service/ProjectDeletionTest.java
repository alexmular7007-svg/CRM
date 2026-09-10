package com.arjun.crm.service;

import com.arjun.crm.controller.ProjectController;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.entity.*;
import com.arjun.crm.enums.ProjectStatus;
import com.arjun.crm.enums.Role;
import com.arjun.crm.enums.TaskPriority;
import com.arjun.crm.enums.TaskStatus;
import com.arjun.crm.enums.WorkspaceRole;
import com.arjun.crm.repository.*;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.impl.ProjectServiceImpl;
import com.arjun.crm.service.impl.TaskServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class ProjectDeletionTest {

    // --- Mocks for ProjectServiceImpl ---
    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private WorkspaceRepository workspaceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskServiceImpl taskService;

    // --- Mocks for ProjectController ---
    @Mock
    private ProjectService projectServiceMock;

    @Mock
    private WorkspaceAuthorizationService workspaceAuthService;

    // --- Mocks for TaskServiceImpl standalone test ---
    @Mock
    private TaskCommentRepository taskCommentRepository;

    @Mock
    private TaskActivityRepository taskActivityRepository;

    @Mock
    private TaskAttachmentRepository taskAttachmentRepository;

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private TaskWatcherRepository taskWatcherRepository;

    @Mock
    private TaskRepository standaloneTaskRepository;

    @Mock
    private WorkspaceRepository standaloneWorkspaceRepository;

    @Mock
    private ProjectRepository standaloneProjectRepository;

    @Mock
    private UserRepository standaloneUserRepository;

    private ProjectServiceImpl projectServiceImpl;
    private TaskServiceImpl standaloneTaskService;
    private ProjectController projectController;

    private Workspace testWorkspace;
    private User testUser;
    private Project testProject;

    @BeforeEach
    void setUp() {
        projectServiceImpl = new ProjectServiceImpl(
                projectRepository,
                workspaceRepository,
                userRepository,
                workspaceMemberRepository,
                projectMemberRepository,
                taskRepository,
                taskService
        );

        standaloneTaskService = new TaskServiceImpl(
                standaloneTaskRepository,
                taskCommentRepository,
                taskActivityRepository,
                taskAttachmentRepository,
                attachmentRepository,
                taskWatcherRepository,
                standaloneUserRepository,
                standaloneProjectRepository,
                workspaceMemberRepository,
                standaloneWorkspaceRepository,
                null,
                null
        );

        projectController = new ProjectController(projectServiceMock, workspaceAuthService);

        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test User")
                .role(Role.ADMIN)
                .build();

        testWorkspace = Workspace.builder()
                .id(10L)
                .name("Test Workspace")
                .owner(testUser)
                .build();

        testProject = Project.builder()
                .id(100L)
                .name("Test Project")
                .workspace(testWorkspace)
                .createdBy(testUser)
                .status(ProjectStatus.ACTIVE)
                .members(new ArrayList<>())
                .build();

        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        org.springframework.security.core.userdetails.UserDetails userDetails = mock(org.springframework.security.core.userdetails.UserDetails.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("test@example.com");
        org.springframework.security.core.context.SecurityContext securityContext = mock(org.springframework.security.core.context.SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        org.springframework.security.core.context.SecurityContextHolder.setContext(securityContext);
    }

    @Test
    @DisplayName("1. Project delete endpoint accepts workspaceId and delegates to workspaceAuthService & projectService")
    void testProjectDeleteEndpointAcceptsWorkspaceId() {
        Long projectId = 100L;
        Long workspaceId = 10L;

        WorkspaceMember member = WorkspaceMember.builder()
                .id(1L)
                .workspace(testWorkspace)
                .user(testUser)
                .role(WorkspaceRole.OWNER)
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(workspaceId)).thenReturn(member);
        doNothing().when(workspaceAuthService).validateOwnerOrAdmin(member);
        doNothing().when(projectServiceMock).deleteProject(projectId);

        ResponseEntity<ApiResponse<Void>> response = projectController.deleteProject(projectId, workspaceId);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Project deleted successfully", response.getBody().getMessage());

        verify(workspaceAuthService, times(1)).validateWorkspaceAccess(workspaceId);
        verify(workspaceAuthService, times(1)).validateOwnerOrAdmin(member);
        verify(projectServiceMock, times(1)).deleteProject(projectId);
    }

    @Test
    @DisplayName("2. Unauthorized workspace deletion remains rejected with AccessDeniedException")
    void testUnauthorizedWorkspaceDeletionRejected() {
        Long projectId = 100L;
        Long workspaceId = 10L;

        WorkspaceMember member = WorkspaceMember.builder()
                .id(2L)
                .workspace(testWorkspace)
                .user(testUser)
                .role(WorkspaceRole.MEMBER)
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(workspaceId)).thenReturn(member);
        doThrow(new AccessDeniedException("User is not an owner or admin of this workspace"))
                .when(workspaceAuthService).validateOwnerOrAdmin(member);

        assertThrows(AccessDeniedException.class, () -> {
            projectController.deleteProject(projectId, workspaceId);
        });

        verify(workspaceAuthService, times(1)).validateWorkspaceAccess(workspaceId);
        verify(workspaceAuthService, times(1)).validateOwnerOrAdmin(member);
        verify(projectServiceMock, never()).deleteProject(any());
    }

    @Test
    @DisplayName("3. Project with no tasks can be deleted")
    void testProjectWithNoTasksCanBeDeleted() {
        Long projectId = 100L;

        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        org.springframework.security.core.userdetails.UserDetails userDetails = mock(org.springframework.security.core.userdetails.UserDetails.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("test@example.com");
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(taskRepository.findByProjectId(projectId)).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> projectServiceImpl.deleteProject(projectId));

        verify(taskRepository, times(1)).findByProjectId(projectId);
        verify(taskService, never()).deleteTaskEntityAndChildren(any());
        verify(projectRepository, times(1)).delete(testProject);
    }

    @Test
    @DisplayName("4. Project with tasks can be deleted (all tasks and children deleted before project)")
    void testProjectWithTasksCanBeDeleted() {
        Long projectId = 100L;

        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        org.springframework.security.core.userdetails.UserDetails userDetails = mock(org.springframework.security.core.userdetails.UserDetails.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("test@example.com");
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

        Task task1 = Task.builder()
                .id(201L)
                .title("Task 1")
                .project(testProject)
                .workspace(testWorkspace)
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .build();

        Task task2 = Task.builder()
                .id(202L)
                .title("Task 2")
                .project(testProject)
                .workspace(testWorkspace)
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.MEDIUM)
                .build();

        List<Task> projectTasks = List.of(task1, task2);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(taskRepository.findByProjectId(projectId)).thenReturn(projectTasks);

        assertDoesNotThrow(() -> projectServiceImpl.deleteProject(projectId));

        // Verify taskService.deleteTaskEntityAndChildren was called for each task
        verify(taskService, times(1)).deleteTaskEntityAndChildren(task1);
        verify(taskService, times(1)).deleteTaskEntityAndChildren(task2);

        // Verify project is deleted
        verify(projectRepository, times(1)).delete(testProject);
    }

    @Test
    @DisplayName("5. Task with records in attachments table cleans up via attachmentRepository.deleteByTaskId")
    void testTaskWithRecordsInAttachmentsTableCleanedUp() {
        Task task = Task.builder()
                .id(301L)
                .title("Task With Attachment")
                .project(testProject)
                .workspace(testWorkspace)
                .attachments(new ArrayList<>())
                .watchers(new ArrayList<>())
                .build();

        // When deleteTaskEntityAndChildren runs:
        standaloneTaskService.deleteTaskEntityAndChildren(task);

        // Verify comments, activities, attachments, attachments table, watchers, and task are deleted in order
        verify(taskCommentRepository, times(1)).deleteByTaskId(301L);
        verify(taskActivityRepository, times(1)).deleteByTaskId(301L);
        verify(attachmentRepository, times(1)).deleteByTaskId(301L);
        verify(standaloneTaskRepository, times(1)).delete(task);
    }

    @Test
    @DisplayName("6. Existing Task deletion behavior still works and delegates to deleteTaskEntityAndChildren")
    void testExistingTaskDeletionStillWorks() {
        Long taskId = 401L;
        Long workspaceId = 10L;

        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        org.springframework.security.core.userdetails.UserDetails userDetails = mock(org.springframework.security.core.userdetails.UserDetails.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("test@example.com");
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

        Task task = Task.builder()
                .id(taskId)
                .title("Existing Task")
                .project(testProject)
                .workspace(testWorkspace)
                .createdBy(testUser)
                .attachments(new ArrayList<>())
                .watchers(new ArrayList<>())
                .build();

        when(standaloneUserRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(standaloneTaskRepository.findById(taskId)).thenReturn(Optional.of(task));

        assertDoesNotThrow(() -> standaloneTaskService.deleteTask(taskId, workspaceId));

        // Verify that deleteTask cleaned up children including the attachments table
        verify(taskCommentRepository, times(1)).deleteByTaskId(taskId);
        verify(taskActivityRepository, times(1)).deleteByTaskId(taskId);
        verify(attachmentRepository, times(1)).deleteByTaskId(taskId);
        verify(standaloneTaskRepository, times(1)).delete(task);
    }
}