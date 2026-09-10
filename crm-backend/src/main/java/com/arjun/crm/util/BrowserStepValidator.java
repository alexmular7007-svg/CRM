package com.arjun.crm.util;

import java.util.*;

/**
 * BrowserStepValidator
 *
 * Strict validator for browser test steps in Chrome Extension test cases (Phase 6C).
 */
public final class BrowserStepValidator {

    public static final Set<String> SUPPORTED_ACTIONS = Set.of(
            "OPEN_PAGE",
            "CLICK",
            "TYPE",
            "WAIT",
            "ASSERT_VISIBLE",
            "ASSERT_TEXT",
            "ASSERT_URL",
            "ASSERT_TITLE",
            "SCREENSHOT",
            "SELECT_OPTION"
    );

    private BrowserStepValidator() {
        // Utility class
    }

    /**
     * Validates the configuration map containing browser test steps.
     *
     * @param configuration The test case configuration JSON map
     * @throws IllegalArgumentException if validation fails
     */
    public static void validate(Map<String, Object> configuration) {
        if (configuration == null) {
            throw new IllegalArgumentException("Browser test configuration is required");
        }

        Object stepsObj = configuration.get("steps");
        if (stepsObj == null) {
            throw new IllegalArgumentException("Browser test configuration must contain a 'steps' list");
        }

        if (!(stepsObj instanceof List<?> stepsList)) {
            throw new IllegalArgumentException("'steps' must be a list of step objects");
        }

        if (stepsList.isEmpty()) {
            throw new IllegalArgumentException("Browser test configuration must contain at least one step");
        }

        validateSteps(stepsList);
    }

    /**
     * Validates a list of browser steps.
     *
     * @param stepsList List of step maps
     * @throws IllegalArgumentException if validation fails
     */
    public static void validateSteps(List<?> stepsList) {
        if (stepsList == null || stepsList.isEmpty()) {
            throw new IllegalArgumentException("Browser test steps list cannot be empty");
        }

        Set<Integer> seenOrders = new HashSet<>();

        for (int i = 0; i < stepsList.size(); i++) {
            Object item = stepsList.get(i);
            if (!(item instanceof Map<?, ?> stepMap)) {
                throw new IllegalArgumentException("Step at index " + i + " must be a JSON object");
            }

            // 1. Action validation
            Object actionObj = stepMap.get("action");
            if (actionObj == null) {
                throw new IllegalArgumentException("Step at index " + i + " is missing required field: action");
            }

            String actionStr = actionObj.toString().trim();
            if (actionStr.isEmpty()) {
                throw new IllegalArgumentException("Step at index " + i + " has an empty action");
            }

            String action = actionStr.toUpperCase();
            if (!SUPPORTED_ACTIONS.contains(action)) {
                throw new IllegalArgumentException("Step at index " + i + " has unsupported action: '" + actionStr + "'");
            }

            // 2. Order validation
            if (stepMap.containsKey("order") && stepMap.get("order") != null) {
                int order;
                try {
                    order = Integer.parseInt(stepMap.get("order").toString().trim());
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Step at index " + i + " has invalid order value: " + stepMap.get("order"));
                }
                if (order < 0) {
                    throw new IllegalArgumentException("Step at index " + i + " cannot have negative order: " + order);
                }
                if (!seenOrders.add(order)) {
                    throw new IllegalArgumentException("Duplicate step order detected: " + order);
                }
            }

            // 3. Action-specific field validations
            switch (action) {
                case "OPEN_PAGE": {
                    String target = getStringField(stepMap, "target", "value", "url");
                    if (target == null || target.isBlank()) {
                        throw new IllegalArgumentException("OPEN_PAGE step at index " + i + " requires a non-empty target URL");
                    }
                    String lower = target.toLowerCase();
                    if (lower.startsWith("file:") || target.matches("^[a-zA-Z]:[\\\\/].*") || target.contains("..")) {
                        throw new IllegalArgumentException("OPEN_PAGE step at index " + i + " cannot target arbitrary filesystem paths");
                    }
                    break;
                }

                case "CLICK": {
                    String target = getStringField(stepMap, "target", "selector");
                    if (target == null || target.isBlank()) {
                        throw new IllegalArgumentException("CLICK step at index " + i + " requires a non-empty target selector");
                    }
                    break;
                }

                case "TYPE": {
                    String target = getStringField(stepMap, "target", "selector");
                    if (target == null || target.isBlank()) {
                        throw new IllegalArgumentException("TYPE step at index " + i + " requires a non-empty target selector");
                    }
                    Object value = stepMap.get("value");
                    if (value == null) value = stepMap.get("text");
                    if (value == null) {
                        throw new IllegalArgumentException("TYPE step at index " + i + " requires a value to type");
                    }
                    break;
                }

                case "WAIT": {
                    Object durObj = stepMap.get("duration");
                    if (durObj == null) durObj = stepMap.get("value");
                    if (durObj == null) durObj = stepMap.get("target");

                    if (durObj == null) {
                        throw new IllegalArgumentException("WAIT step at index " + i + " requires a duration");
                    }

                    long duration;
                    try {
                        duration = Long.parseLong(durObj.toString().trim());
                    } catch (NumberFormatException e) {
                        throw new IllegalArgumentException("WAIT step at index " + i + " requires a numeric duration: " + durObj);
                    }

                    if (duration < 0) {
                        throw new IllegalArgumentException("WAIT duration cannot be negative: " + duration);
                    }
                    if (duration > 10000) {
                        throw new IllegalArgumentException("WAIT duration cannot exceed 10000ms: " + duration);
                    }
                    break;
                }

                case "ASSERT_VISIBLE": {
                    String target = getStringField(stepMap, "target", "selector");
                    if (target == null || target.isBlank()) {
                        throw new IllegalArgumentException("ASSERT_VISIBLE step at index " + i + " requires a non-empty target selector");
                    }
                    break;
                }

                case "ASSERT_TEXT": {
                    String target = getStringField(stepMap, "target", "selector");
                    if (target == null || target.isBlank()) {
                        throw new IllegalArgumentException("ASSERT_TEXT step at index " + i + " requires a non-empty target selector");
                    }
                    Object value = stepMap.get("value");
                    if (value == null) value = stepMap.get("expected");
                    if (value == null) value = stepMap.get("expectedText");
                    if (value == null) {
                        throw new IllegalArgumentException("ASSERT_TEXT step at index " + i + " requires an expected text value");
                    }
                    break;
                }

                case "ASSERT_URL": {
                    String expected = getStringField(stepMap, "value", "expected", "target", "url");
                    if (expected == null || expected.isBlank()) {
                        throw new IllegalArgumentException("ASSERT_URL step at index " + i + " requires an expected URL pattern");
                    }
                    break;
                }

                case "ASSERT_TITLE": {
                    String expected = getStringField(stepMap, "value", "expected", "target", "title");
                    if (expected == null || expected.isBlank()) {
                        throw new IllegalArgumentException("ASSERT_TITLE step at index " + i + " requires an expected title");
                    }
                    break;
                }

                case "SCREENSHOT": {
                    Object fnObj = stepMap.get("filename");
                    if (fnObj == null) fnObj = stepMap.get("value");
                    if (fnObj == null) fnObj = stepMap.get("target");

                    if (fnObj != null) {
                        String fn = fnObj.toString().trim();
                        if (fn.isEmpty()) {
                            throw new IllegalArgumentException("SCREENSHOT filename cannot be empty if provided");
                        }
                        if (fn.contains("..") || fn.contains("/") || fn.contains("\\") || fn.matches("^[a-zA-Z]:.*")) {
                            throw new IllegalArgumentException("SCREENSHOT filename cannot contain path traversal or directory characters: " + fn);
                        }
                    }
                    break;
                }

                case "SELECT_OPTION": {
                    String target = getStringField(stepMap, "target", "selector");
                    if (target == null || target.isBlank()) {
                        throw new IllegalArgumentException("SELECT_OPTION step at index " + i + " requires a non-empty target selector");
                    }
                    Object value = stepMap.get("value");
                    if (value == null) value = stepMap.get("option");
                    if (value == null) {
                        throw new IllegalArgumentException("SELECT_OPTION step at index " + i + " requires an option value");
                    }
                    break;
                }

                default:
                    throw new IllegalArgumentException("Unsupported browser action: " + action);
            }
        }
    }

    private static String getStringField(Map<?, ?> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null) {
                return val.toString().trim();
            }
        }
        return null;
    }
}
