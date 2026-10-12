package com.example.demo.chat;

import com.example.demo.crianca.AcessoCriancaService;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChatControllerTest {
    private final UUID child = UUID.randomUUID();
    private final UUID user = UUID.randomUUID();
    private final JdbcClient jdbc = mock(JdbcClient.class);
    private final AcessoCriancaService access = mock(AcessoCriancaService.class);
    private final Authentication auth = mock(Authentication.class);

    private ChatController controller(boolean canChat) {
        when(auth.getName()).thenReturn(user.toString());
        when(access.requireProfessional(child, user)).thenReturn(new AcessoCriancaService.Vinculo(
            "profissional", null, false, "profissional", true, true, canChat, false, false));
        return new ChatController(jdbc, access);
    }

    @Test void rejectsEmptyMessageWithoutWriting() {
        var error = assertThrows(ResponseStatusException.class, () ->
            controller(true).send(child, new ChatController.MensagemRequest("  ", null), auth));
        assertEquals(400, error.getStatusCode().value());
        verifyNoInteractions(jdbc);
    }

    @Test void refusesChatWithoutPermission() {
        var error = assertThrows(ResponseStatusException.class, () ->
            controller(false).send(child, new ChatController.MensagemRequest("Oi", List.of()), auth));
        assertEquals(403, error.getStatusCode().value());
        verifyNoInteractions(jdbc);
    }

    @Test void rejectsDuplicateAttachmentsBeforeWriting() {
        UUID file = UUID.randomUUID();
        assertThrows(ResponseStatusException.class, () ->
            controller(true).send(child, new ChatController.MensagemRequest("", List.of(file, file)), auth));
        verifyNoInteractions(jdbc);
    }

    @Test void capsAttachmentCountAndAllowsAttachmentOnlyRequest() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            UUID file = UUID.randomUUID();
            assertTrue(validator.validate(new ChatController.MensagemRequest("", List.of(file))).isEmpty());
            assertFalse(validator.validate(new ChatController.MensagemRequest("", java.util.Collections.nCopies(6, file))).isEmpty());
            assertFalse(validator.validate(new ChatController.MensagemRequest("a".repeat(5001), List.of())).isEmpty());
        }
    }
}
