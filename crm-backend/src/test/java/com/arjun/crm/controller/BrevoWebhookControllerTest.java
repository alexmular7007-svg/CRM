package com.arjun.crm.controller;

import com.arjun.crm.service.EmailAnalyticsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class BrevoWebhookControllerTest {

    private static final String SECRET = "test-webhook-secret";
    private static final String BODY = "{\"event\":\"DELIVERED\",\"email\":\"test@example.com\",\"message-id\":\"message-1\",\"ts\":1720000000}";

    private EmailAnalyticsService analyticsService;
    private BrevoWebhookController controller;

    @BeforeEach
    void setUp() throws Exception {
        analyticsService = mock(EmailAnalyticsService.class);
        controller = new BrevoWebhookController(analyticsService, new ObjectMapper());
        var secret = BrevoWebhookController.class.getDeclaredField("brevoWebhookSecret");
        secret.setAccessible(true);
        secret.set(controller, SECRET);
    }

    @Test
    void acceptsValidSignatureOverExactRawBody() {
        var response = controller.handleBrevoWebhook(BODY, signature(BODY));

        assertEquals(200, response.getStatusCode().value());
        verify(analyticsService).processWebhookEvent(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rejectsInvalidSignature() {
        var response = controller.handleBrevoWebhook(BODY, signature("different-body"));

        assertEquals(401, response.getStatusCode().value());
    }

    @Test
    void rejectsMissingSignature() {
        var response = controller.handleBrevoWebhook(BODY, null);

        assertEquals(401, response.getStatusCode().value());
    }

    @Test
    void rejectsWhenWebhookSecretIsMissing() throws Exception {
        var secret = BrevoWebhookController.class.getDeclaredField("brevoWebhookSecret");
        secret.setAccessible(true);
        secret.set(controller, "");

        var response = controller.handleBrevoWebhook(BODY, signature(BODY));

        assertEquals(401, response.getStatusCode().value());
    }

    @Test
    void rejectsMalformedPayloadAfterSignatureVerification() {
        String malformedBody = "{not-json";

        var response = controller.handleBrevoWebhook(malformedBody, signature(malformedBody));

        assertEquals(400, response.getStatusCode().value());
    }

    private String signature(String body) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}
