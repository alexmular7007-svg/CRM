package com.arjun.crm.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures the chrome_extension_test_cases check constraint includes BROWSER
 * on application startup, guaranteeing schema compatibility across all environments.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class ChromeExtensionDatabaseInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            log.info("Checking and updating chrome_extension_test_cases test_type check constraint for BROWSER support...");
            jdbcTemplate.execute("ALTER TABLE chrome_extension_test_cases DROP CONSTRAINT IF EXISTS chrome_extension_test_cases_test_type_check");
            jdbcTemplate.execute("ALTER TABLE chrome_extension_test_cases ADD CONSTRAINT chrome_extension_test_cases_test_type_check CHECK (test_type IN ('API_CRUD', 'STORAGE_CRUD', 'DOM_INJECTION', 'INTEGRATION', 'BROWSER'))");
            log.info("✓ chrome_extension_test_cases check constraint successfully verified/updated to allow BROWSER");
        } catch (Exception e) {
            log.warn("Could not alter chrome_extension_test_cases check constraint (table may not exist yet or running in unsupported DB): {}", e.getMessage());
        }
    }
}
