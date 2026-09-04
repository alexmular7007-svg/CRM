package com.arjun.crm.entity;

import com.arjun.crm.enums.TestResultStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * ChromeExtensionTestResult Entity
 *
 * Stores the specific assertion result and execution telemetry for an individual test case run.
 */
@Entity
@Table(
    name = "chrome_extension_test_results",
    indexes = {
        @Index(name = "idx_chrome_test_results_run_id", columnList = "test_run_id"),
        @Index(name = "idx_chrome_test_results_case_id", columnList = "test_case_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChromeExtensionTestResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_run_id", nullable = false)
    private ChromeExtensionTestRun testRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", nullable = false)
    private ChromeExtensionTestCase testCase;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TestResultStatus status = TestResultStatus.PASS;

    @Column
    @Builder.Default
    private Integer executionTimeMs = 0;

    @Column
    private Integer actualStatusCode;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> actualResponsePayload;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> assertionDetails;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
