-- V17: Extend Chrome Extension Test Run Table with error_tests and logs

ALTER TABLE chrome_extension_test_runs
    ADD COLUMN IF NOT EXISTS error_tests INT NOT NULL DEFAULT 0;

ALTER TABLE chrome_extension_test_runs
    ADD COLUMN IF NOT EXISTS logs TEXT;
