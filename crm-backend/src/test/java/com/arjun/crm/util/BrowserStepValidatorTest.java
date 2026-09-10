package com.arjun.crm.util;

import com.arjun.crm.dto.request.BrowserTestCaseDto;
import com.arjun.crm.enums.TestCaseType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class BrowserStepValidatorTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("1. BROWSER enum serialization and valueOf")
    void testBrowserEnumSerialization() throws Exception {
        assertEquals("BROWSER", TestCaseType.BROWSER.name());
        assertEquals(TestCaseType.BROWSER, TestCaseType.valueOf("BROWSER"));

        String json = objectMapper.writeValueAsString(TestCaseType.BROWSER);
        assertEquals("\"BROWSER\"", json);

        TestCaseType deserialized = objectMapper.readValue("\"BROWSER\"", TestCaseType.class);
        assertEquals(TestCaseType.BROWSER, deserialized);
    }

    @Test
    @DisplayName("2. Valid browser test case configuration")
    void testValidBrowserTestCaseConfiguration() {
        Map<String, Object> config = Map.of(
                "steps", List.of(
                        Map.of("order", 0, "action", "OPEN_PAGE", "target", "chrome-extension://<extension-id>/src/popup/popup.html"),
                        Map.of("order", 1, "action", "ASSERT_TITLE", "value", "Chrome Extension Playground")
                )
        );

        assertDoesNotThrow(() -> BrowserStepValidator.validate(config));
    }

    @Test
    @DisplayName("3. Valid step list with all supported actions")
    void testValidStepList() {
        List<Map<String, Object>> steps = List.of(
                Map.of("order", 0, "action", "OPEN_PAGE", "target", "https://crm.example.com"),
                Map.of("order", 1, "action", "CLICK", "target", "#submit-btn"),
                Map.of("order", 2, "action", "TYPE", "target", "input#email", "value", "user@test.com"),
                Map.of("order", 3, "action", "WAIT", "duration", 1000),
                Map.of("order", 4, "action", "ASSERT_VISIBLE", "target", ".success-toast"),
                Map.of("order", 5, "action", "ASSERT_TEXT", "target", ".title", "value", "Welcome"),
                Map.of("order", 6, "action", "ASSERT_URL", "value", "/dashboard"),
                Map.of("order", 7, "action", "ASSERT_TITLE", "value", "Dashboard"),
                Map.of("order", 8, "action", "SCREENSHOT", "filename", "dashboard_view"),
                Map.of("order", 9, "action", "SELECT_OPTION", "target", "select#role", "value", "ADMIN")
        );

        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(steps));
    }

    @Test
    @DisplayName("4. OPEN_PAGE validation")
    void testOpenPageValidation() {
        Map<String, Object> valid = Map.of("action", "OPEN_PAGE", "target", "https://crm.example.com/login");
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(valid)));

        Map<String, Object> emptyTarget = Map.of("action", "OPEN_PAGE", "target", "   ");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> BrowserStepValidator.validateSteps(List.of(emptyTarget)));
        assertTrue(ex.getMessage().contains("non-empty target URL"));

        Map<String, Object> fileUrl = Map.of("action", "OPEN_PAGE", "target", "file:///C:/Windows/system32");
        assertThrows(IllegalArgumentException.class, () -> BrowserStepValidator.validateSteps(List.of(fileUrl)));

        Map<String, Object> windowsPath = Map.of("action", "OPEN_PAGE", "target", "C:\\Windows");
        assertThrows(IllegalArgumentException.class, () -> BrowserStepValidator.validateSteps(List.of(windowsPath)));
    }

    @Test
    @DisplayName("5. CLICK validation")
    void testClickValidation() {
        Map<String, Object> valid = Map.of("action", "CLICK", "target", "button#save");
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(valid)));

        Map<String, Object> emptyTarget = Map.of("action", "CLICK", "target", "");
        assertThrows(IllegalArgumentException.class, () -> BrowserStepValidator.validateSteps(List.of(emptyTarget)));
    }

    @Test
    @DisplayName("6. TYPE validation")
    void testTypeValidation() {
        Map<String, Object> valid = Map.of("action", "TYPE", "target", "input#search", "value", "test lead");
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(valid)));

        Map<String, Object> missingVal = Map.of("action", "TYPE", "target", "input#search");
        assertThrows(IllegalArgumentException.class, () -> BrowserStepValidator.validateSteps(List.of(missingVal)));
    }

    @Test
    @DisplayName("7. WAIT validation")
    void testWaitValidation() {
        Map<String, Object> valid = Map.of("action", "WAIT", "duration", 500);
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(valid)));

        Map<String, Object> nonNumeric = Map.of("action", "WAIT", "duration", "abc");
        assertThrows(IllegalArgumentException.class, () -> BrowserStepValidator.validateSteps(List.of(nonNumeric)));
    }

    @Test
    @DisplayName("8. WAIT = 0 (boundary minimum)")
    void testWaitZero() {
        Map<String, Object> step = Map.of("action", "WAIT", "duration", 0);
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(step)));
    }

    @Test
    @DisplayName("9. WAIT = 10000 (boundary maximum)")
    void testWaitTenThousand() {
        Map<String, Object> step = Map.of("action", "WAIT", "duration", 10000);
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(step)));
    }

    @Test
    @DisplayName("10. WAIT > 10000 rejected")
    void testWaitGreaterThanTenThousand() {
        Map<String, Object> step = Map.of("action", "WAIT", "duration", 10001);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> BrowserStepValidator.validateSteps(List.of(step)));
        assertTrue(ex.getMessage().contains("cannot exceed 10000ms"));
    }

    @Test
    @DisplayName("11. Negative WAIT rejected")
    void testNegativeWait() {
        Map<String, Object> step = Map.of("action", "WAIT", "duration", -1);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> BrowserStepValidator.validateSteps(List.of(step)));
        assertTrue(ex.getMessage().contains("cannot be negative"));
    }

    @Test
    @DisplayName("12. ASSERT_VISIBLE validation")
    void testAssertVisibleValidation() {
        Map<String, Object> valid = Map.of("action", "ASSERT_VISIBLE", "target", "#ext-badge");
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(valid)));

        Map<String, Object> missingTarget = Map.of("action", "ASSERT_VISIBLE");
        assertThrows(IllegalArgumentException.class, () -> BrowserStepValidator.validateSteps(List.of(missingTarget)));
    }

    @Test
    @DisplayName("13. ASSERT_TEXT validation")
    void testAssertTextValidation() {
        Map<String, Object> valid = Map.of("action", "ASSERT_TEXT", "target", "h1", "value", "Dashboard");
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(valid)));

        Map<String, Object> missingValue = Map.of("action", "ASSERT_TEXT", "target", "h1");
        assertThrows(IllegalArgumentException.class, () -> BrowserStepValidator.validateSteps(List.of(missingValue)));
    }

    @Test
    @DisplayName("14. ASSERT_URL validation")
    void testAssertUrlValidation() {
        Map<String, Object> valid = Map.of("action", "ASSERT_URL", "value", "/app/leads");
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(valid)));

        Map<String, Object> emptyUrl = Map.of("action", "ASSERT_URL", "value", "   ");
        assertThrows(IllegalArgumentException.class, () -> BrowserStepValidator.validateSteps(List.of(emptyUrl)));
    }

    @Test
    @DisplayName("15. ASSERT_TITLE validation")
    void testAssertTitleValidation() {
        Map<String, Object> valid = Map.of("action", "ASSERT_TITLE", "value", "CRM Portal");
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(valid)));

        Map<String, Object> emptyTitle = Map.of("action", "ASSERT_TITLE", "value", "");
        assertThrows(IllegalArgumentException.class, () -> BrowserStepValidator.validateSteps(List.of(emptyTitle)));
    }

    @Test
    @DisplayName("16. SCREENSHOT validation")
    void testScreenshotValidation() {
        Map<String, Object> defaultName = Map.of("action", "SCREENSHOT");
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(defaultName)));

        Map<String, Object> validName = Map.of("action", "SCREENSHOT", "filename", "popup_landing");
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(validName)));
    }

    @Test
    @DisplayName("17. SELECT_OPTION validation")
    void testSelectOptionValidation() {
        Map<String, Object> valid = Map.of("action", "SELECT_OPTION", "target", "select#status", "value", "ACTIVE");
        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(valid)));

        Map<String, Object> missingVal = Map.of("action", "SELECT_OPTION", "target", "select#status");
        assertThrows(IllegalArgumentException.class, () -> BrowserStepValidator.validateSteps(List.of(missingVal)));
    }

    @Test
    @DisplayName("18. Unsupported action rejected")
    void testUnsupportedActionRejected() {
        Map<String, Object> step = Map.of("action", "EXECUTE_ARBITRARY_JS", "target", "eval()");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> BrowserStepValidator.validateSteps(List.of(step)));
        assertTrue(ex.getMessage().contains("unsupported action"));
    }

    @Test
    @DisplayName("19. Missing required target rejected")
    void testMissingRequiredTarget() {
        Map<String, Object> step = Map.of("action", "CLICK");
        assertThrows(IllegalArgumentException.class, () -> BrowserStepValidator.validateSteps(List.of(step)));
    }

    @Test
    @DisplayName("20. Missing required value rejected")
    void testMissingRequiredValue() {
        Map<String, Object> step = Map.of("action", "TYPE", "target", "#input");
        assertThrows(IllegalArgumentException.class, () -> BrowserStepValidator.validateSteps(List.of(step)));
    }

    @Test
    @DisplayName("21. Unsafe screenshot filename rejected")
    void testUnsafeScreenshotFilenameRejected() {
        List<String> unsafeNames = List.of(
                "../evil",
                "..\\evil",
                "/etc/passwd",
                "C:\\Windows\\system32",
                "sub/dir",
                "sub\\dir"
        );

        for (String unsafe : unsafeNames) {
            Map<String, Object> step = Map.of("action", "SCREENSHOT", "filename", unsafe);
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> BrowserStepValidator.validateSteps(List.of(step)));
            assertTrue(ex.getMessage().contains("path traversal") || ex.getMessage().contains("directory characters"));
        }
    }

    @Test
    @DisplayName("22. Extension ID placeholder preserved in target")
    void testExtensionIdPlaceholderPreserved() {
        String targetWithAngle = "chrome-extension://<extension-id>/src/popup/popup.html";
        String targetWithBraces = "chrome-extension://{extensionId}/src/popup/popup.html";

        Map<String, Object> step1 = Map.of("action", "OPEN_PAGE", "target", targetWithAngle);
        Map<String, Object> step2 = Map.of("action", "OPEN_PAGE", "target", targetWithBraces);

        assertDoesNotThrow(() -> BrowserStepValidator.validateSteps(List.of(step1, step2)));
        assertEquals(targetWithAngle, step1.get("target"));
        assertEquals(targetWithBraces, step2.get("target"));
    }

    @Test
    @DisplayName("23. Existing API test case compatibility (DTO & Enums)")
    void testExistingApiTestCompatibility() {
        // Confirm all existing TestCaseType enum values exist with exact names
        assertEquals(TestCaseType.API_CRUD, TestCaseType.valueOf("API_CRUD"));
        assertEquals(TestCaseType.STORAGE_CRUD, TestCaseType.valueOf("STORAGE_CRUD"));
        assertEquals(TestCaseType.DOM_INJECTION, TestCaseType.valueOf("DOM_INJECTION"));
        assertEquals(TestCaseType.INTEGRATION, TestCaseType.valueOf("INTEGRATION"));
        assertEquals(TestCaseType.BROWSER, TestCaseType.valueOf("BROWSER"));

        // Confirm BrowserTestCaseDto works with or without steps
        BrowserTestCaseDto smokeDto = BrowserTestCaseDto.builder()
                .type("POPUP_SMOKE")
                .name("Popup Smoke")
                .build();
        assertNull(smokeDto.getSteps());

        BrowserTestCaseDto browserDto = BrowserTestCaseDto.builder()
                .type("BROWSER")
                .name("Interactive Popup Test")
                .steps(List.of(Map.of("action", "OPEN_PAGE", "target", "https://example.com")))
                .build();
        assertNotNull(browserDto.getSteps());
        assertEquals(1, browserDto.getSteps().size());
    }
}
