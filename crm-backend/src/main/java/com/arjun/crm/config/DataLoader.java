package com.arjun.crm.config;

import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.Role;
import com.arjun.crm.enums.UserStatus;
import com.arjun.crm.enums.WorkspaceRole;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;

/**
 * Initializes test data when the application starts.
 * This allows frontend to test login, workspaces, and other features
 * without having to manually register users first.
 */
@Configuration
@Slf4j
public class DataLoader {

    @Bean
    public CommandLineRunner loadData(
            UserRepository userRepository,
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository workspaceMemberRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            log.info("═══════════════════════════════════════════════════════════════");
            log.info("  INITIALIZING TEST DATA");
            log.info("═══════════════════════════════════════════════════════════════");

            // Check if test users already exist
            if (userRepository.count() > 0) {
                log.info("Test data already exists, skipping initialization");
                return;
            }

            try {
                // Create test users
                User testUser1 = User.builder()
                        .fullName("Test User One")
                        .email("test1@example.com")
                        .password(passwordEncoder.encode("password123"))
                        .role(Role.USER)
                        .status(UserStatus.ACTIVE)
                        .build();

                User testUser2 = User.builder()
                        .fullName("Test User Two")
                        .email("test2@example.com")
                        .password(passwordEncoder.encode("password123"))
                        .role(Role.USER)
                        .status(UserStatus.ACTIVE)
                        .build();

                User adminUser = User.builder()
                        .fullName("Admin User")
                        .email("admin@example.com")
                        .password(passwordEncoder.encode("password123"))
                        .role(Role.ADMIN)
                        .status(UserStatus.ACTIVE)
                        .build();

                testUser1 = userRepository.save(testUser1);
                testUser2 = userRepository.save(testUser2);
                adminUser = userRepository.save(adminUser);

                log.info("✓ Created test users:");
                log.info("  - test1@example.com / password123");
                log.info("  - test2@example.com / password123");
                log.info("  - admin@example.com / password123");

                // Create test workspaces
                Workspace workspace1 = Workspace.builder()
                        .name("Marketing Team")
                        .description("Marketing department workspace")
                        .owner(testUser1)
                        .build();

                Workspace workspace2 = Workspace.builder()
                        .name("Development Team")
                        .description("Development department workspace")
                        .owner(testUser2)
                        .build();

                workspace1 = workspaceRepository.save(workspace1);
                workspace2 = workspaceRepository.save(workspace2);

                log.info("✓ Created test workspaces:");
                log.info("  - Marketing Team (ID: {})", workspace1.getId());
                log.info("  - Development Team (ID: {})", workspace2.getId());

                // Add members to workspaces
                WorkspaceMember member1 = WorkspaceMember.builder()
                        .workspace(workspace1)
                        .user(testUser1)
                        .role(WorkspaceRole.OWNER)
                        .build();

                WorkspaceMember member2 = WorkspaceMember.builder()
                        .workspace(workspace1)
                        .user(testUser2)
                        .role(WorkspaceRole.MEMBER)
                        .build();

                WorkspaceMember member3 = WorkspaceMember.builder()
                        .workspace(workspace2)
                        .user(testUser2)
                        .role(WorkspaceRole.OWNER)
                        .build();

                WorkspaceMember member4 = WorkspaceMember.builder()
                        .workspace(workspace2)
                        .user(adminUser)
                        .role(WorkspaceRole.ADMIN)
                        .build();

                workspaceMemberRepository.save(member1);
                workspaceMemberRepository.save(member2);
                workspaceMemberRepository.save(member3);
                workspaceMemberRepository.save(member4);

                log.info("✓ Added workspace members");

                log.info("═══════════════════════════════════════════════════════════════");
                log.info("  ✓ TEST DATA INITIALIZATION COMPLETE");
                log.info("═══════════════════════════════════════════════════════════════");
                log.info("  You can now login with:");
                log.info("    Email: test1@example.com");
                log.info("    Password: password123");
                log.info("═══════════════════════════════════════════════════════════════");

            } catch (Exception e) {
                log.error("Failed to initialize test data", e);
            }
        };
    }
}
