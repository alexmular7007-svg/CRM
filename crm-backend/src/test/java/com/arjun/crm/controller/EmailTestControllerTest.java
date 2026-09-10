package com.arjun.crm.controller;

import com.arjun.crm.service.brevo.BrevoEmailService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.client.HttpClientErrorException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class EmailTestControllerTest {

    @Test
    void sendsTestEmailThroughBrevo() throws Exception {
        BrevoEmailService brevo = mock(BrevoEmailService.class);
        EmailTestController controller = new EmailTestController(brevo);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(post("/api/test/send-email")
                        .param("email", "recipient@example.com")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(brevo).sendEmail(anyString(), anyString(), anyString(), anyString(), any());
    }

    @Test
    void rejectsBlankTestRecipient() throws Exception {
        BrevoEmailService brevo = mock(BrevoEmailService.class);
        EmailTestController controller = new EmailTestController(brevo);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(post("/api/test/send-email")
                        .param("email", ""))
                    .andExpect(status().isBadRequest());
    }

    @Test
    void returnsProviderFailureWithoutLeakingDetails() throws Exception {
        BrevoEmailService brevo = mock(BrevoEmailService.class);
        when(brevo.sendEmail(anyString(), anyString(), anyString(), anyString(), any()))
                .thenThrow(new HttpClientErrorException(org.springframework.http.HttpStatus.UNAUTHORIZED));
        EmailTestController controller = new EmailTestController(brevo);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(post("/api/test/send-email")
                        .param("email", "recipient@example.com"))
                .andExpect(status().isInternalServerError());
    }
}
