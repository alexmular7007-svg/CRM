package com.arjun.crm.service;

import com.arjun.crm.controller.TaskController;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.TaskResponse;
import com.arjun.crm.entity.Task;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.Role;
import com.arjun.crm.enums.TaskPriority;
import com.arjun.crm.enums.TaskStatus;
import com.arjun.crm.enums.WorkspaceRole;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.*;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.impl.TaskServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class TaskWorkspaceIsolationTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private WorkspaceRepository workspaceRepository;

    @Mock
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

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
    private TaskActivityService taskActivityService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private WorkspaceAuthorizationService workspaceAuthService;

    @InjectMocks
    private TaskServiceImpl taskService;

    private TaskController taskController;

    private Workspace workspace1;
    private Workspace workspace14;
    private User testUser;
    private Task ws1Task1;
    private Task ws1Task2;
    private Task ws14Task1;
    private Task ws14Task2;

    @BeforeEach
    void setUp() {
        taskController = new TaskController(taskService, workspaceAuthService);

        testUser = User.builder()
                .id(1L)
                .email("test1@example.com")
                .fullName("Test User One")
                .role(Role.USER)
                .build();

        workspace1 = Workspace.builder()
                .id(1L)
                .name("Marketing Team")
                .owner(testUser)
                .build();

        workspace14 = Workspace.builder()
                .id(14L)
                .name("Wastewizard's Workspace")
                .owner(testUser)
                .build();

        ws1Task1 = Task.builder()
                .id(101L)
                .title("Workspace 1 Task Alpha")
                .description("First task in WS1")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .workspace(workspace1)
                .createdBy(testUser)
                .createdAt(LocalDateTime.now().minusHours(2))
                .build();

        ws1Task2 = Task.builder()
                .id(102L)
                .title("Workspace 1 Task Beta")
                .description("Second task in WS1")
                .status(TaskStatus.DONE)
                .priority(TaskPriority.MEDIUM)
                .workspace(workspace1)
                .createdBy(testUser)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        ws14Task1 = Task.builder()
                .id(201L)
                .title("Workspace 14 Task Gamma")
                .description("First task in WS14")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.URGENT)
                .workspace(workspace14)
                .createdBy(testUser)
                .createdAt(LocalDateTime.now().minusHours(4))
                .build();

        ws14Task2 = Task.builder()
                .id(202L)
                .title("Workspace 14 Task Delta")
                .description("Second task in WS14")
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.LOW)
                .workspace(workspace14)
                .createdBy(testUser)
                .createdAt(LocalDateTime.now().minusHours(3))
                .build();

        when(workspaceRepository.existsById(1L)).thenReturn(true);
        when(workspaceRepository.existsById(14L)).thenReturn(true);
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace1));
        when(workspaceRepository.findById(14L)).thenReturn(Optional.of(workspace14));

        WorkspaceMember member1 = WorkspaceMember.builder()
                .id(1L)
                .workspace(workspace1)
                .user(testUser)
                .role(WorkspaceRole.OWNER)
                .build();
        WorkspaceMember member14 = WorkspaceMember.builder()
                .id(2L)
                .workspace(workspace14)
                .user(testUser)
                .role(WorkspaceRole.OWNER)
                .build();

        when(workspaceAuthService.validateWorkspaceAccess(1L)).thenReturn(member1);
        when(workspaceAuthService.validateWorkspaceAccess(14L)).thenReturn(member14);
    }

    @Test
    @DisplayName("TEST 1: Request workspaceId=1 returns only tasks belonging to Workspace 1")
    void test1_getAllTasks_workspace1_returnsOnlyWorkspace1Tasks() {
        Page<Task> ws1Page = new PageImpl<>(List.of(ws1Task1, ws1Task2), PageRequest.of(0, 10), 2);
        when(taskRepository.findByWorkspaceId(eq(1L), any(Pageable.class))).thenReturn(ws1Page);

        ResponseEntity<ApiResponse<Page<TaskResponse>>> response = taskController.getAllTasks(1L, 0, 10, "createdAt", "desc");

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());

        Page<TaskResponse> pageResult = response.getBody().getData();
        assertEquals(2, pageResult.getTotalElements());
        List<TaskResponse> tasks = pageResult.getContent();
        assertEquals(2, tasks.size());

        for (TaskResponse task : tasks) {
            assertTrue(task.getId().equals(101L) || task.getId().equals(102L),
                    "Returned task ID " + task.getId() + " must belong to Workspace 1");
        }

        verify(workspaceAuthService).validateWorkspaceAccess(1L);
        verify(taskRepository).findByWorkspaceId(eq(1L), any(Pageable.class));
        verify(taskRepository, never()).findByWorkspaceId(eq(14L), any(Pageable.class));
        verify(taskRepository, never()).findAllByOrderByCreatedAtDesc(any(Pageable.class));
    }

    @Test
    @DisplayName("TEST 2: Request workspaceId=14 returns only tasks belonging to Workspace 14")
    void test2_getAllTasks_workspace14_returnsOnlyWorkspace14Tasks() {
        Page<Task> ws14Page = new PageImpl<>(List.of(ws14Task1, ws14Task2), PageRequest.of(0, 10), 2);
        when(taskRepository.findByWorkspaceId(eq(14L), any(Pageable.class))).thenReturn(ws14Page);

        ResponseEntity<ApiResponse<Page<TaskResponse>>> response = taskController.getAllTasks(14L, 0, 10, "createdAt", "desc");

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());

        Page<TaskResponse> pageResult = response.getBody().getData();
        assertEquals(2, pageResult.getTotalElements());
        List<TaskResponse> tasks = pageResult.getContent();
        assertEquals(2, tasks.size());

        for (TaskResponse task : tasks) {
            assertTrue(task.getId().equals(201L) || task.getId().equals(202L),
                    "Returned task ID " + task.getId() + " must belong to Workspace 14");
        }

        verify(workspaceAuthService).validateWorkspaceAccess(14L);
        verify(taskRepository).findByWorkspaceId(eq(14L), any(Pageable.class));
        verify(taskRepository, never()).findByWorkspaceId(eq(1L), any(Pageable.class));
        verify(taskRepository, never()).findAllByOrderByCreatedAtDesc(any(Pageable.class));
    }

    @Test
    @DisplayName("TEST 3: Ensure a task from Workspace 14 cannot appear in Workspace 1 response")
    void test3_crossWorkspaceLeakage_workspace14TaskCannotAppearInWorkspace1() {
        Page<Task> ws1Page = new PageImpl<>(List.of(ws1Task1, ws1Task2), PageRequest.of(0, 10), 2);
        when(taskRepository.findByWorkspaceId(eq(1L), any(Pageable.class))).thenReturn(ws1Page);

        ResponseEntity<ApiResponse<Page<TaskResponse>>> response = taskController.getAllTasks(1L, 0, 10, "createdAt", "desc");
        List<TaskResponse> tasks = response.getBody().getData().getContent();

        boolean containsWs14Task = tasks.stream().anyMatch(t -> t.getId().equals(201L) || t.getId().equals(202L)
                || t.getTitle().contains("Workspace 14"));
        assertFalse(containsWs14Task, "Critical Multi-Tenant Isolation: Workspace 14 tasks must NEVER leak into Workspace 1");
    }

    @Test
    @DisplayName("TEST 4: Ensure a task from Workspace 1 cannot appear in Workspace 14 response")
    void test4_crossWorkspaceLeakage_workspace1TaskCannotAppearInWorkspace14() {
        Page<Task> ws14Page = new PageImpl<>(List.of(ws14Task1, ws14Task2), PageRequest.of(0, 10), 2);
        when(taskRepository.findByWorkspaceId(eq(14L), any(Pageable.class))).thenReturn(ws14Page);

        ResponseEntity<ApiResponse<Page<TaskResponse>>> response = taskController.getAllTasks(14L, 0, 10, "createdAt", "desc");
        List<TaskResponse> tasks = response.getBody().getData().getContent();

        boolean containsWs1Task = tasks.stream().anyMatch(t -> t.getId().equals(101L) || t.getId().equals(102L)
                || t.getTitle().startsWith("Workspace 1 "));
        assertFalse(containsWs1Task, "Critical Multi-Tenant Isolation: Workspace 1 tasks must NEVER leak into Workspace 14");
    }

    @Test
    @DisplayName("TEST 5: Verify pagination works correctly with workspace scoping")
    void test5_pagination_worksWithWorkspaceScoping() {
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        Page<Task> page2 = new PageImpl<>(List.of(ws1Task2), PageRequest.of(1, 1), 2);
        when(taskRepository.findByWorkspaceId(eq(1L), pageableCaptor.capture())).thenReturn(page2);

        ResponseEntity<ApiResponse<Page<TaskResponse>>> response = taskController.getAllTasks(1L, 1, 1, "createdAt", "desc");

        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().getData().getTotalElements());
        assertEquals(1, response.getBody().getData().getContent().size());
        assertEquals(102L, response.getBody().getData().getContent().get(0).getId());

        Pageable captured = pageableCaptor.getValue();
        assertEquals(1, captured.getPageNumber());
        assertEquals(1, captured.getPageSize());
    }

    @Test
    @DisplayName("TEST 6: Verify sorting works correctly with workspace scoping")
    void test6_sorting_worksWithWorkspaceScoping() {
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        Page<Task> sortedPage = new PageImpl<>(List.of(ws1Task1, ws1Task2), PageRequest.of(0, 10), 2);
        when(taskRepository.findByWorkspaceId(eq(1L), pageableCaptor.capture())).thenReturn(sortedPage);

        taskController.getAllTasks(1L, 0, 10, "dueDate", "asc");

        Pageable captured = pageableCaptor.getValue();
        assertNotNull(captured.getSort().getOrderFor("dueDate"));
        assertTrue(captured.getSort().getOrderFor("dueDate").isAscending(), "Sort order must be ASC");

        taskController.getAllTasks(1L, 0, 10, "priority", "desc");
        Pageable capturedDesc = pageableCaptor.getValue();
        assertNotNull(capturedDesc.getSort().getOrderFor("priority"));
        assertTrue(capturedDesc.getSort().getOrderFor("priority").isDescending(), "Sort order must be DESC");
    }

    @Test
    @DisplayName("TEST 7: Verify unauthorized workspace access is rejected with AccessDeniedException")
    void test7_unauthorizedWorkspaceAccess_isRejected() {
        Long unauthorizedWorkspaceId = 999L;
        doThrow(new AccessDeniedException("User does not have access to workspace: 999"))
                .when(workspaceAuthService).validateWorkspaceAccess(unauthorizedWorkspaceId);

        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> {
            taskController.getAllTasks(unauthorizedWorkspaceId, 0, 10, "createdAt", "desc");
        });

        assertTrue(exception.getMessage().contains("User does not have access to workspace"));
        verify(taskRepository, never()).findByWorkspaceId(eq(unauthorizedWorkspaceId), any(Pageable.class));
        verify(taskRepository, never()).findAllByOrderByCreatedAtDesc(any(Pageable.class));
    }

    @Test
    @DisplayName("TEST 8: Service layer throws ResourceNotFoundException if workspace does not exist")
    void test8_serviceLayer_nonexistentWorkspace_throwsResourceNotFound() {
        when(workspaceRepository.existsById(888L)).thenReturn(false);

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            taskService.getAllTasks(888L, PageRequest.of(0, 10));
        });

        assertTrue(exception.getMessage().contains("Workspace not found with ID: 888"));
        verify(taskRepository, never()).findByWorkspaceId(eq(888L), any(Pageable.class));
    }
}
