package com.arjun.crm.service.brevo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BrevoEmailServiceTest {

    private RestTemplate restTemplate;
    private BrevoEmailService service;

    @BeforeEach
    void setUp() {
        restTemplate = org.mockito.Mockito.mock(RestTemplate.class);
        service = new BrevoEmailService(restTemplate);
        ReflectionTestUtils.setField(service, "apiKey", "test-key");
        ReflectionTestUtils.setField(service, "fromEmail", "sender@example.com");
        ReflectionTestUtils.setField(service, "fromName", "TaskFlow");
    }

    @Test
    void sendsHtmlAndPlainTextThroughBrevo() {
        when(restTemplate.exchange(any(String.class), any(HttpMethod.class), any(), any(Class.class)))
                .thenReturn(ResponseEntity.ok("{\"messageId\":\"msg-123\"}"));

        assertEquals("{\"messageId\":\"msg-123\"}",
                service.sendEmail("recipient@example.com", "Subject", "<p>Hello</p>", "Hello", Map.of("campaign_id", 7L)));

        ArgumentCaptor<org.springframework.http.HttpEntity<Map<String, Object>>> captor = ArgumentCaptor.forClass(org.springframework.http.HttpEntity.class);
        verify(restTemplate).exchange(any(String.class), any(HttpMethod.class), captor.capture(), any(Class.class));
        Map<String, Object> body = captor.getValue().getBody();
        assertEquals("Hello", body.get("textContent"));
        assertEquals("<p>Hello</p>", body.get("htmlContent"));
        assertEquals("recipient@example.com", ((java.util.List<?>) body.get("to")).get(0).toString().contains("recipient@example.com") ? "recipient@example.com" : "");
    }

    @Test
    void rejectsInvalidRecipientBeforeProviderCall() {
        assertThrows(IllegalArgumentException.class,
                () -> service.sendEmail("invalid", "Subject", "<p>Hello</p>"));
        org.mockito.Mockito.verifyNoInteractions(restTemplate);
    }

    @Test
    void surfacesProviderAuthenticationFailure() {
        when(restTemplate.exchange(any(String.class), any(HttpMethod.class), any(), any(Class.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED));

        assertThrows(HttpClientErrorException.class,
                () -> service.sendEmail("recipient@example.com", "Subject", "<p>Hello</p>"));
    }
}
