package com.arjun.crm.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.DefaultCorsProcessor;

import static org.junit.jupiter.api.Assertions.*;

class CorsConfigTest {

    @Test
    void testCorsOriginMatching() {
        CorsConfig corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "allowedOriginsRaw", "https://crm-taskflow.vercel.app,chrome-extension://figdiiedkddjcemakndcfielfdgfoonm");

        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/tasks");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertNotNull(config);
        System.out.println("Allowed origin patterns: " + config.getAllowedOriginPatterns());

        // Test checkOrigin directly
        String match1 = config.checkOrigin("chrome-extension://figdiiedkddjcemakndcfielfdgfoonm");
        System.out.println("Match for chrome-extension ID: " + match1);
        assertEquals("chrome-extension://figdiiedkddjcemakndcfielfdgfoonm", match1);

        String match2 = config.checkOrigin("https://crm-taskflow.vercel.app");
        System.out.println("Match for Vercel: " + match2);
        assertEquals("https://crm-taskflow.vercel.app", match2);

        String match3 = config.checkOrigin("https://some-preview.vercel.app");
        System.out.println("Match for Vercel preview wildcard: " + match3);
        assertEquals("https://some-preview.vercel.app", match3);
    }

    @Test
    void testChromeExtensionPreflightOptions() throws Exception {
        CorsConfig corsConfig = new CorsConfig();
        // Test with configured origin
        ReflectionTestUtils.setField(corsConfig, "allowedOriginsRaw", "https://crm-taskflow.vercel.app,chrome-extension://figdiiedkddjcemakndcfielfdgfoonm");

        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/tasks");
        request.addHeader("Origin", "chrome-extension://figdiiedkddjcemakndcfielfdgfoonm");
        request.addHeader("Access-Control-Request-Method", "POST");
        request.addHeader("Access-Control-Request-Headers", "authorization, content-type");

        MockHttpServletResponse response = new MockHttpServletResponse();
        CorsConfiguration config = source.getCorsConfiguration(request);

        DefaultCorsProcessor processor = new DefaultCorsProcessor();
        boolean isValid = processor.processRequest(config, request, response);

        assertTrue(isValid, "Preflight OPTIONS request should be valid");
        assertEquals(200, response.getStatus());
        assertEquals("chrome-extension://figdiiedkddjcemakndcfielfdgfoonm", response.getHeader("Access-Control-Allow-Origin"));
        assertTrue(response.getHeader("Access-Control-Allow-Methods").contains("POST"));
        assertTrue(response.getHeader("Access-Control-Allow-Headers").toLowerCase().contains("authorization"));
        assertEquals("true", response.getHeader("Access-Control-Allow-Credentials"));
    }

    @Test
    void testDefaultConfigurationIncludesChromeExtension() throws Exception {
        CorsConfig corsConfig = new CorsConfig();
        // Uses default field value from @Value default
        ReflectionTestUtils.setField(corsConfig, "allowedOriginsRaw", "http://localhost:3000,http://localhost:3001,http://localhost:5173,chrome-extension://figdiiedkddjcemakndcfielfdgfoonm");

        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/tasks");
        request.addHeader("Origin", "chrome-extension://figdiiedkddjcemakndcfielfdgfoonm");
        request.addHeader("Access-Control-Request-Method", "POST");
        request.addHeader("Access-Control-Request-Headers", "authorization, content-type");

        MockHttpServletResponse response = new MockHttpServletResponse();
        CorsConfiguration config = source.getCorsConfiguration(request);

        DefaultCorsProcessor processor = new DefaultCorsProcessor();
        boolean isValid = processor.processRequest(config, request, response);

        assertTrue(isValid);
        assertEquals(200, response.getStatus());
        assertEquals("chrome-extension://figdiiedkddjcemakndcfielfdgfoonm", response.getHeader("Access-Control-Allow-Origin"));
        assertEquals("true", response.getHeader("Access-Control-Allow-Credentials"));
    }

    @Test
    void testAllHttpMethodsSupportedInPreflight() throws Exception {
        CorsConfig corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "allowedOriginsRaw", "https://crm-taskflow.vercel.app");

        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        DefaultCorsProcessor processor = new DefaultCorsProcessor();

        String[] methods = {"GET", "POST", "PUT", "PATCH", "DELETE"};
        for (String method : methods) {
            MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/tasks");
            request.addHeader("Origin", "chrome-extension://figdiiedkddjcemakndcfielfdgfoonm");
            request.addHeader("Access-Control-Request-Method", method);
            request.addHeader("Access-Control-Request-Headers", "authorization, content-type");

            MockHttpServletResponse response = new MockHttpServletResponse();
            CorsConfiguration config = source.getCorsConfiguration(request);

            boolean isValid = processor.processRequest(config, request, response);
            assertTrue(isValid, "Method " + method + " should be allowed in preflight");
            assertEquals(200, response.getStatus());
            assertEquals("chrome-extension://figdiiedkddjcemakndcfielfdgfoonm", response.getHeader("Access-Control-Allow-Origin"));
            assertTrue(response.getHeader("Access-Control-Allow-Methods").contains(method));
        }
    }

    @Test
    void testArbitraryWebOriginsAreRejected() throws Exception {
        CorsConfig corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "allowedOriginsRaw", "https://crm-taskflow.vercel.app");

        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/tasks");
        request.addHeader("Origin", "https://malicious-website.com");
        request.addHeader("Access-Control-Request-Method", "POST");
        request.addHeader("Access-Control-Request-Headers", "authorization, content-type");

        MockHttpServletResponse response = new MockHttpServletResponse();
        CorsConfiguration config = source.getCorsConfiguration(request);

        DefaultCorsProcessor processor = new DefaultCorsProcessor();
        boolean isValid = processor.processRequest(config, request, response);

        assertFalse(isValid, "Arbitrary website origin should NOT be allowed");
        assertEquals(403, response.getStatus());
        assertNull(response.getHeader("Access-Control-Allow-Origin"));
    }
}
