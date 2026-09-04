package com.arjun.crm.entity;

import com.arjun.crm.enums.TestCaseType;
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
import java.util.Map;

/**
 * ChromeExtensionTestCase Entity
 *
 * Represents an individual test case (API CRUD, Storage CRUD, DOM test)
 * associated with a Chrome Extension project.
 */
@Entity
@Table(
    name = "chrome_extension_test_cases",
    indexes = {
        @Index(name = "idx_chrome_test_cases_ext_id", columnList = "extension_id"),
        @Index(name = "idx_chrome_test_cases_type", columnList = "test_type"),
        @Index(name = "idx_chrome_test_cases_enabled", columnList = "enabled")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChromeExtensionTestCase {

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

    @Enumerated(EnumType.STRING)
    @Column(name = "test_type", nullable = false, length = 50)
    @Builder.Default
    private TestCaseType testType = TestCaseType.API_CRUD;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> configuration;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> expectedResult;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
