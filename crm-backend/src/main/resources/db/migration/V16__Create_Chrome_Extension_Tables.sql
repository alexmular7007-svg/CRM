-- V16: Chrome Extension Test Framework Foundation Tables

CREATE TABLE chrome_extensions (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    manifest_json JSONB,
    created_by_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP
);

CREATE INDEX idx_chrome_ext_workspace_id ON chrome_extensions(workspace_id);
CREATE INDEX idx_chrome_ext_status ON chrome_extensions(status);
CREATE INDEX idx_chrome_ext_workspace_status ON chrome_extensions(workspace_id, status);
CREATE INDEX idx_chrome_ext_created_at ON chrome_extensions(created_at);

CREATE TABLE chrome_extension_test_cases (
    id BIGSERIAL PRIMARY KEY,
    extension_id BIGINT NOT NULL REFERENCES chrome_extensions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    test_type VARCHAR(50) NOT NULL DEFAULT 'API_CRUD',
    configuration JSONB,
    expected_result JSONB,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chrome_test_cases_ext_id ON chrome_extension_test_cases(extension_id);
CREATE INDEX idx_chrome_test_cases_type ON chrome_extension_test_cases(test_type);
CREATE INDEX idx_chrome_test_cases_enabled ON chrome_extension_test_cases(enabled);

CREATE TABLE chrome_extension_test_runs (
    id BIGSERIAL PRIMARY KEY,
    extension_id BIGINT NOT NULL REFERENCES chrome_extensions(id) ON DELETE CASCADE,
    triggered_by_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    environment VARCHAR(50) NOT NULL DEFAULT 'DEVELOPMENT',
    total_tests INT NOT NULL DEFAULT 0,
    passed_tests INT NOT NULL DEFAULT 0,
    failed_tests INT NOT NULL DEFAULT 0,
    duration_ms BIGINT DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chrome_test_runs_ext_id ON chrome_extension_test_runs(extension_id);
CREATE INDEX idx_chrome_test_runs_status ON chrome_extension_test_runs(status);

CREATE TABLE chrome_extension_test_results (
    id BIGSERIAL PRIMARY KEY,
    test_run_id BIGINT NOT NULL REFERENCES chrome_extension_test_runs(id) ON DELETE CASCADE,
    test_case_id BIGINT NOT NULL REFERENCES chrome_extension_test_cases(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PASS',
    execution_time_ms INT DEFAULT 0,
    actual_status_code INT,
    actual_response_payload JSONB,
    error_message TEXT,
    assertion_details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chrome_test_results_run_id ON chrome_extension_test_results(test_run_id);
CREATE INDEX idx_chrome_test_results_case_id ON chrome_extension_test_results(test_case_id);
