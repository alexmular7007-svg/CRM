package com.arjun.crm.entity;

import com.arjun.crm.enums.ChromeExtensionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * ChromeExtension Entity
 *
 * Represents a registered Chrome Extension within a workspace.
 * Provides multi-tenant data isolation, soft delete, and configuration.
 */
@Entity
@Table(
    name = "chrome_extensions",
    indexes = {
        @Index(name = "idx_chrome_ext_workspace_id", columnList = "workspace_id"),
        @Index(name = "idx_chrome_ext_status", columnList = "status"),
        @Index(name = "idx_chrome_ext_workspace_status", columnList = "workspace_id, status"),
        @Index(name = "idx_chrome_ext_created_at", columnList = "created_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChromeExtension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String version = "1.0.0";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ChromeExtensionStatus status = ChromeExtensionStatus.ACTIVE;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> manifestJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "extension", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChromeExtensionTestCase> testCases = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime archivedAt;
}
