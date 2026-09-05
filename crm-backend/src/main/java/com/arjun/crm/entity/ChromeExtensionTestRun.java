package com.arjun.crm.entity;

import com.arjun.crm.enums.TestRunStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ChromeExtensionTestRun Entity
 *
 * Represents an execution run of an extension's test suite.
 */
@Entity
@Table(
    name = "chrome_extension_test_runs",
    indexes = {
        @Index(name = "idx_chrome_test_runs_ext_id", columnList = "extension_id"),
        @Index(name = "idx_chrome_test_runs_status", columnList = "status")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChromeExtensionTestRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "extension_id", nullable = false)
    private ChromeExtension extension;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_by_id", nullable = false)
    private User triggeredBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private TestRunStatus status = TestRunStatus.PENDING;

    @Column(length = 50)
    @Builder.Default
    private String environment = "DEVELOPMENT";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suite_id")
    private ChromeExtensionTestSuite suite;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalTests = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer passedTests = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer failedTests = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer errorTests = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer skippedTests = 0;

    @Column
    @Builder.Default
    private Long durationMs = 0L;

    @Column(columnDefinition = "TEXT")
    private String logs;

    @Column
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "testRun", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChromeExtensionTestResult> results = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
