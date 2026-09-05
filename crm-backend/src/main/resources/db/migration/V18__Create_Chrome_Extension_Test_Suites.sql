-- V18: Chrome Extension Test Suites and Suite Items

CREATE TABLE chrome_extension_test_suites (
    id BIGSERIAL PRIMARY KEY,
    extension_id BIGINT NOT NULL REFERENCES chrome_extensions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    stop_on_failure BOOLEAN NOT NULL DEFAULT FALSE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chrome_test_suites_ext_id ON chrome_extension_test_suites(extension_id);
CREATE INDEX idx_chrome_test_suites_enabled ON chrome_extension_test_suites(enabled);

CREATE TABLE chrome_extension_test_suite_items (
    id BIGSERIAL PRIMARY KEY,
    suite_id BIGINT NOT NULL REFERENCES chrome_extension_test_suites(id) ON DELETE CASCADE,
    test_case_id BIGINT NOT NULL REFERENCES chrome_extension_test_cases(id) ON DELETE CASCADE,
    execution_order INT NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_suite_item_order UNIQUE (suite_id, execution_order)
);

CREATE INDEX idx_suite_items_suite_id ON chrome_extension_test_suite_items(suite_id);
CREATE INDEX idx_suite_items_case_id ON chrome_extension_test_suite_items(test_case_id);

ALTER TABLE chrome_extension_test_runs
    ADD COLUMN IF NOT EXISTS suite_id BIGINT REFERENCES chrome_extension_test_suites(id) ON DELETE SET NULL;

ALTER TABLE chrome_extension_test_runs
    ADD COLUMN IF NOT EXISTS skipped_tests INT NOT NULL DEFAULT 0;

CREATE INDEX idx_chrome_test_runs_suite_id ON chrome_extension_test_runs(suite_id);
