package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ChromeExtensionTestSuite Entity
 *
 * Represents an ordered, configurable test suite belonging to a Chrome Extension.
 * Groups multiple test cases with custom ordering and execution policies (e.g. stopOnFailure).
 */
@Entity
@Table(
    name = "chrome_extension_test_suites",
    indexes = {
        @Index(name = "idx_chrome_test_suites_ext_id", columnList = "extension_id"),
        @Index(name = "idx_chrome_test_suites_enabled", columnList = "enabled")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChromeExtensionTestSuite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "extension_id", nullable = false)
    private ChromeExtension extension;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "stop_on_failure", nullable = false)
    @Builder.Default
    private Boolean stopOnFailure = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "suite", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("executionOrder ASC")
    @Builder.Default
    private List<ChromeExtensionTestSuiteItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
