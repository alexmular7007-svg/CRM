package com.arjun.crm.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Initialize database schema updates that Hibernate might miss
 * Runs after application is fully ready
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class DatabaseInitializer {

    private final DataSource dataSource;

    @EventListener(ApplicationReadyEvent.class)
    public void initializeDatabase() {
        log.info("Running database schema initialization...");
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // Add archived column to projects if it doesn't exist
            String addArchivedColumn = "ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false";
            log.info("Executing: {}", addArchivedColumn);
            stmt.execute(addArchivedColumn);
            log.info("Successfully added archived column to projects table");

            // Create index on archived column
            String createIndex = "CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived)";
            log.info("Executing: {}", createIndex);
            stmt.execute(createIndex);
            log.info("Successfully created index on archived column");

            log.info("Database schema initialization completed successfully");

        } catch (Exception e) {
            log.error("Error during database initialization", e);
            // Don't throw - let application start anyway
        }
    }
}

