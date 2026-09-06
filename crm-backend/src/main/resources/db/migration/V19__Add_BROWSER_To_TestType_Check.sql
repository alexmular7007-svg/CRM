-- V19: Add BROWSER to chrome_extension_test_cases test_type check constraint

ALTER TABLE chrome_extension_test_cases
DROP CONSTRAINT IF EXISTS chrome_extension_test_cases_test_type_check;

ALTER TABLE chrome_extension_test_cases
ADD CONSTRAINT chrome_extension_test_cases_test_type_check
CHECK (
    test_type IN (
        'API_CRUD',
        'STORAGE_CRUD',
        'DOM_INJECTION',
        'INTEGRATION',
        'BROWSER'
    )
);
