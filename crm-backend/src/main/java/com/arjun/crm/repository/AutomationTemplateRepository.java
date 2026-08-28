package com.arjun.crm.repository;

import com.arjun.crm.entity.AutomationTemplate;
import com.arjun.crm.enums.AutomationTriggerType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * AutomationTemplateRepository - PHASE 9: Automation Templates
 *
 * Data access layer for automation template operations.
 * Templates are system-defined, read-only resources.
 */
@Repository
public interface AutomationTemplateRepository extends JpaRepository<AutomationTemplate, Long> {

    /**
     * Find a template by exact name
     */
    Optional<AutomationTemplate> findByName(String name);

    /**
     * Get all active templates with optional filtering
     */
    Page<AutomationTemplate> findByIsActiveTrue(Pageable pageable);

    /**
     * Get active templates by trigger type
     * Useful for showing templates that match the selected trigger in workflow builder
     */
    Page<AutomationTemplate> findByIsActiveTrueAndTriggerType(
            AutomationTriggerType triggerType,
            Pageable pageable
    );

    /**
     * Get active templates by category
     * Useful for filtering gallery by category
     */
    Page<AutomationTemplate> findByIsActiveTrueAndCategory(
            String category,
            Pageable pageable
    );

    /**
     * Get active templates ordered by usage count (most popular first)
     * Useful for highlighting popular templates in the gallery
     */
    List<AutomationTemplate> findByIsActiveTrueOrderByUsageCountDesc();

    /**
     * Get active templates ordered by creation date (newest first)
     */
    List<AutomationTemplate> findByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * Increment usage count when a template is used
     */
    @Modifying
    @Transactional
    @Query("UPDATE AutomationTemplate t SET t.usageCount = t.usageCount + 1 WHERE t.id = :templateId")
    void incrementUsageCount(@Param("templateId") Long templateId);

    /**
     * Check if template exists by name
     */
    boolean existsByName(String name);

    /**
     * Get all distinct categories for filter UI
     */
    @Query("SELECT DISTINCT t.category FROM AutomationTemplate t WHERE t.isActive = true ORDER BY t.category")
    List<String> findDistinctCategories();
}
