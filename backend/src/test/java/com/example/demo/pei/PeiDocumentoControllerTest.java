package com.example.demo.pei;

import com.example.demo.crianca.AcessoCriancaService;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PeiDocumentoControllerTest {
    @Test void validatesDocumentContents() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            var topic = new PeiDocumentoController.Topic("objetivo", "Objetivo", true, Map.of("acao", "Pedir ajuda"), List.of());
            assertTrue(validator.validate(new PeiDocumentoController.Document(0, List.of(topic))).isEmpty());
            assertFalse(validator.validate(new PeiDocumentoController.Document(-1, List.of(topic))).isEmpty());
            var invalid = new PeiDocumentoController.Topic("objetivo", "", true, Map.of("acao", "x".repeat(20001)), List.of());
            assertFalse(validator.validate(new PeiDocumentoController.Document(0, List.of(invalid))).isEmpty());
        }
    }
    @Test void deniesBothReadAndWriteBeforeDatabaseAccess() {
        var jdbc = mock(JdbcClient.class);
        var access = mock(AcessoCriancaService.class);
        var auth = mock(Authentication.class);
        var child = UUID.randomUUID(); var user = UUID.randomUUID();
        when(auth.getName()).thenReturn(user.toString());
        when(access.requireProfessional(child, user)).thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN));
        var controller = new PeiDocumentoController(jdbc, access, new ObjectMapper());
        assertThrows(ResponseStatusException.class, () -> controller.get(child, 2026, 2, auth));
        assertThrows(ResponseStatusException.class, () -> controller.save(child, 2026, 2, new PeiDocumentoController.Document(0,List.of()),auth));
        verifyNoInteractions(jdbc);
    }
    @Test void staleVersionReturnsConflictWithoutOverwriting() {
        var jdbc = mock(JdbcClient.class);
        var query = mock(JdbcClient.StatementSpec.class, RETURNS_SELF);
        when(jdbc.sql(anyString())).thenReturn(query);
        when(query.update()).thenReturn(0);
        var auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(UUID.randomUUID().toString());
        var controller = new PeiDocumentoController(jdbc, mock(AcessoCriancaService.class), new ObjectMapper());
        var error = assertThrows(ResponseStatusException.class, () -> controller.save(UUID.randomUUID(),2026,2,new PeiDocumentoController.Document(3,List.of()),auth));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(query).param("version",3L);
    }
}
