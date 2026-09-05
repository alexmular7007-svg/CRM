package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * ChromeExtensionTestSuiteItem Entity
 *
 * Represents an individual ordered item within a test suite, referencing an existing test case.
 * Enforces unique execution order per suite and allows per-item enabled/disabled toggles.
 */
@Entity
@Table(
    name = "chrome_extension_test_suite_items",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_suite_item_order", columnNames = {"suite_id", "execution_order"})
    },
    indexes = {
        @Index(name = "idx_suite_items_suite_id", columnList = "suite_id"),
        @Index(name = "idx_suite_items_case_id", columnList = "test_case_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChromeExtensionTestSuiteItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suite_id", nullable = false)
    private ChromeExtensionTestSuite suite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", nullable = false)
    private ChromeExtensionTestCase testCase;

    @Column(name = "execution_order", nullable = false)
    @Builder.Default
    private Integer executionOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
