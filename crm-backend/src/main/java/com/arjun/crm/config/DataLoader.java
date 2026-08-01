package com.arjun.crm.config;

import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.entity.Task;
import com.arjun.crm.entity.Project;
import com.arjun.crm.entity.LeadMagnet;
import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailTemplate;
import com.arjun.crm.entity.EmailCampaignSegment;
import com.arjun.crm.enums.Role;
import com.arjun.crm.enums.UserStatus;
import com.arjun.crm.enums.WorkspaceRole;
import com.arjun.crm.enums.TaskStatus;
import com.arjun.crm.enums.TaskPriority;
import com.arjun.crm.enums.ProjectStatus;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.repository.WorkspaceMemberRepository;
import com.arjun.crm.repository.TaskRepository;
import com.arjun.crm.repository.ProjectRepository;
import com.arjun.crm.repository.LeadMagnetRepository;
import com.arjun.crm.repository.EmailCampaignRepository;
import com.arjun.crm.repository.EmailTemplateRepository;
import com.arjun.crm.repository.EmailCampaignSegmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.time.LocalDateTime;

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
            TaskRepository taskRepository,
            ProjectRepository projectRepository,
            LeadMagnetRepository leadMagnetRepository,
            EmailCampaignRepository emailCampaignRepository,
            EmailTemplateRepository emailTemplateRepository,
            EmailCampaignSegmentRepository segmentRepository,
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

                // ═══════════════════════════════════════════════════════════════
                // CREATE DEMO DATA FOR TESTING
                // ═══════════════════════════════════════════════════════════════

                // Create demo Project for workspace 1
                Project project1 = Project.builder()
                        .workspace(workspace1)
                        .name("Q3 Marketing Campaign")
                        .description("Launch summer marketing initiatives")
                        .status(ProjectStatus.ACTIVE)
                        .createdBy(testUser1)
                        .build();
                project1 = projectRepository.save(project1);
                log.info("✓ Created demo project: {}", project1.getName());

                // Create demo Tasks for workspace 1
                Task task1 = Task.builder()
                        .workspace(workspace1)
                        .project(project1)
                        .title("Design campaign banner")
                        .description("Create social media assets for campaign")
                        .status(TaskStatus.IN_PROGRESS)
                        .priority(TaskPriority.HIGH)
                        .assignedTo(testUser1)
                        .createdBy(testUser1)
                        .dueDate(LocalDateTime.now().plusDays(7).toLocalDate())
                        .build();
                taskRepository.save(task1);

                Task task2 = Task.builder()
                        .workspace(workspace1)
                        .project(project1)
                        .title("Setup email distribution list")
                        .description("Prepare subscriber list for campaign")
                        .status(TaskStatus.DONE)
                        .priority(TaskPriority.MEDIUM)
                        .assignedTo(testUser2)
                        .createdBy(testUser1)
                        .build();
                taskRepository.save(task2);

                Task task3 = Task.builder()
                        .workspace(workspace1)
                        .project(project1)
                        .title("Review campaign metrics")
                        .description("Analyze performance data and ROI")
                        .status(TaskStatus.TODO)
                        .priority(TaskPriority.LOW)
                        .assignedTo(testUser1)
                        .createdBy(testUser1)
                        .dueDate(LocalDateTime.now().plusDays(14).toLocalDate())
                        .build();
                taskRepository.save(task3);

                log.info("✓ Created 3 demo tasks");

                // Create demo LeadMagnets for workspace 1
                LeadMagnet magnet1 = LeadMagnet.builder()
                        .workspace(workspace1)
                        .name("Free Marketing Checklist")
                        .description("10-point checklist for successful campaigns")
                        .slug("marketing-checklist")
                        .publicToken("pub_" + System.currentTimeMillis() + "_1")
                        .isActive(true)
                        .createdBy(testUser1)
                        .build();
                leadMagnetRepository.save(magnet1);

                LeadMagnet magnet2 = LeadMagnet.builder()
                        .workspace(workspace1)
                        .name("Email Templates Bundle")
                        .description("Professional email templates for campaigns")
                        .slug("email-templates")
                        .publicToken("pub_" + System.currentTimeMillis() + "_2")
                        .isActive(true)
                        .createdBy(testUser1)
                        .build();
                leadMagnetRepository.save(magnet2);

                log.info("✓ Created 2 demo lead magnets");

                // Create demo EmailCampaigns for workspace 1
                EmailCampaign campaign1 = EmailCampaign.builder()
                        .workspace(workspace1)
                        .name("Summer Sales Kickoff")
                        .description("Launch email campaign for summer products")
                        .status("DRAFT")
                        .isActive(true)
                        .createdBy(testUser1)
                        .build();
                emailCampaignRepository.save(campaign1);

                EmailCampaign campaign2 = EmailCampaign.builder()
                        .workspace(workspace1)
                        .name("Product Announcement")
                        .description("Notify subscribers about new features")
                        .status("SCHEDULED")
                        .isActive(true)
                        .createdBy(testUser1)
                        .scheduledAt(LocalDateTime.now().plusDays(3))
                        .build();
                emailCampaignRepository.save(campaign2);

                EmailCampaign campaign3 = EmailCampaign.builder()
                        .workspace(workspace1)
                        .name("Newsletter Week 1")
                        .description("Regular weekly newsletter")
                        .status("SENT")
                        .isActive(true)
                        .createdBy(testUser1)
                        .sendCompletedAt(LocalDateTime.now().minusDays(7))
                        .build();
                emailCampaignRepository.save(campaign3);

                log.info("✓ Created 3 demo email campaigns");

                // Create demo EmailTemplates for workspace 1
                EmailTemplate template1 = EmailTemplate.builder()
                        .workspace(workspace1)
                        .name("Welcome Email")
                        .description("Professional welcome email template for new subscribers")
                        .category("WELCOME")
                        .subjectTemplate("Welcome to {companyName}!")
                        .htmlContent("<html><body><h1>Welcome!</h1><p>Hello {firstName},</p><p>Thank you for subscribing to our newsletter. We're excited to have you on board!</p><p>Best regards,<br/>The Team</p></body></html>")
                        .plainTextContent("Welcome!\n\nHello {firstName},\n\nThank you for subscribing to our newsletter. We're excited to have you on board!\n\nBest regards,\nThe Team")
                        .variables(new String[]{"firstName", "companyName"})
                        .isPublic(true)
                        .createdBy(testUser1)
                        .build();
                emailTemplateRepository.save(template1);

                EmailTemplate template2 = EmailTemplate.builder()
                        .workspace(workspace1)
                        .name("Promotional Campaign")
                        .description("Eye-catching promotional email template for sales campaigns")
                        .category("PROMOTIONAL")
                        .subjectTemplate("Exclusive {discountPercent}% Off - Limited Time!")
                        .htmlContent("<html><body><h1>Special Offer!</h1><p>Dear {firstName},</p><p>We're offering an exclusive {discountPercent}% discount on all items!</p><p>This limited offer ends on {expiryDate}.</p><p>Shop now and save!</p><p>Best regards,<br/>The Sales Team</p></body></html>")
                        .plainTextContent("Special Offer!\n\nDear {firstName},\n\nWe're offering an exclusive {discountPercent}% discount on all items!\n\nThis limited offer ends on {expiryDate}.\n\nShop now and save!\n\nBest regards,\nThe Sales Team")
                        .variables(new String[]{"firstName", "discountPercent", "expiryDate"})
                        .isPublic(true)
                        .createdBy(testUser1)
                        .build();
                emailTemplateRepository.save(template2);

                EmailTemplate template3 = EmailTemplate.builder()
                        .workspace(workspace1)
                        .name("Newsletter Template")
                        .description("Regular newsletter template for weekly updates")
                        .category("NEWSLETTER")
                        .subjectTemplate("{monthName} Newsletter - What's New!")
                        .htmlContent("<html><body><h1>{monthName} Newsletter</h1><p>Hello {firstName},</p><h2>This Month's Highlights</h2><ul><li>Feature 1: {feature1}</li><li>Feature 2: {feature2}</li><li>Feature 3: {feature3}</li></ul><p>Stay tuned for more updates!</p><p>Best regards,<br/>The Newsletter Team</p></body></html>")
                        .plainTextContent("{monthName} Newsletter\n\nHello {firstName},\n\nThis Month's Highlights\n- Feature 1: {feature1}\n- Feature 2: {feature2}\n- Feature 3: {feature3}\n\nStay tuned for more updates!\n\nBest regards,\nThe Newsletter Team")
                        .variables(new String[]{"firstName", "monthName", "feature1", "feature2", "feature3"})
                        .isPublic(true)
                        .createdBy(testUser1)
                        .build();
                emailTemplateRepository.save(template3);

                EmailTemplate template4 = EmailTemplate.builder()
                        .workspace(workspace1)
                        .name("Order Confirmation")
                        .description("Transactional email template for order confirmations")
                        .category("TRANSACTIONAL")
                        .subjectTemplate("Order Confirmed - {orderNumber}")
                        .htmlContent("<html><body><h1>Order Confirmed!</h1><p>Hello {firstName},</p><p>Your order #{orderNumber} has been confirmed.</p><p>Order Total: {orderTotal}</p><p>Estimated Delivery: {deliveryDate}</p><p>Thank you for your purchase!</p><p>Best regards,<br/>The Support Team</p></body></html>")
                        .plainTextContent("Order Confirmed!\n\nHello {firstName},\n\nYour order #{orderNumber} has been confirmed.\n\nOrder Total: {orderTotal}\nEstimated Delivery: {deliveryDate}\n\nThank you for your purchase!\n\nBest regards,\nThe Support Team")
                        .variables(new String[]{"firstName", "orderNumber", "orderTotal", "deliveryDate"})
                        .isPublic(true)
                        .createdBy(testUser1)
                        .build();
                emailTemplateRepository.save(template4);

                log.info("✓ Created 4 demo email templates");

                // Create demo EmailCampaignSegments for workspace 1
                EmailCampaignSegment segment1 = EmailCampaignSegment.builder()
                        .workspace(workspace1)
                        .name("Active Subscribers")
                        .description("Segment containing all active subscribers")
                        .filterCriteria("{\"status\": \"ACTIVE\", \"subscriptionStatus\": \"SUBSCRIBED\"}")
                        .leadCount(150L)
                        .createdBy(testUser1)
                        .build();
                segmentRepository.save(segment1);

                EmailCampaignSegment segment2 = EmailCampaignSegment.builder()
                        .workspace(workspace1)
                        .name("Premium Members")
                        .description("Segment for premium tier subscribers")
                        .filterCriteria("{\"tier\": \"PREMIUM\", \"subscriptionStatus\": \"SUBSCRIBED\"}")
                        .leadCount(45L)
                        .createdBy(testUser1)
                        .build();
                segmentRepository.save(segment2);

                EmailCampaignSegment segment3 = EmailCampaignSegment.builder()
                        .workspace(workspace1)
                        .name("Engaged Users")
                        .description("Segment for users with high engagement")
                        .filterCriteria("{\"engagementScore\": {\"gt\": 70}, \"lastClickDate\": {\"after\": \"30 days ago\"}}")
                        .leadCount(98L)
                        .createdBy(testUser1)
                        .build();
                segmentRepository.save(segment3);

                EmailCampaignSegment segment4 = EmailCampaignSegment.builder()
                        .workspace(workspace1)
                        .name("Recent Signups")
                        .description("Segment for users who signed up in the last 30 days")
                        .filterCriteria("{\"signupDate\": {\"after\": \"30 days ago\"}}")
                        .leadCount(67L)
                        .createdBy(testUser1)
                        .build();
                segmentRepository.save(segment4);

                log.info("✓ Created 4 demo email campaign segments");

                // ═══════════════════════════════════════════════════════════════
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
