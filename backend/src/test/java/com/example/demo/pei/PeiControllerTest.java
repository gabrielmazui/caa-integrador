package com.example.demo.pei;

import com.example.demo.crianca.AcessoCriancaService;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PeiControllerTest {
    @Test void acceptsModelCategoriesAndLegacyNotes() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            for (String category : new String[]{"identificacao", "anamnese", "checklist", "protocolo", "resultado_protocolo", "observacao_sala", "observacao_recreio", "observacao_outros", "estudo_caso", "objetivo", "adaptacao_ambiente", "recursos", "adaptacao_material", "adaptacao_sala", "adaptacao_atividade", "adaptacao_tempo", "seguranca_gatilhos", "seguranca_sinais", "seguranca_comportamento", "seguranca_acalmar", "seguranca_prevenir", "seguranca_substituta", "seguranca_responsaveis", "revisao", "comunicacao", "outro"}) {
                assertTrue(validator.validate(new PeiController.AnotacaoRequest(category, "Registro observado", 2, 2026)).isEmpty(), category);
            }
            assertFalse(validator.validate(new PeiController.AnotacaoRequest("invalida", "Texto", 2, 2026)).isEmpty());
        }
    }

    @Test void deniesReadingNotesBeforeQueryingWhenNotProfessional() {
        var jdbc = mock(JdbcClient.class);
        var access = mock(AcessoCriancaService.class);
        var auth = mock(Authentication.class);
        var child = UUID.randomUUID();
        var user = UUID.randomUUID();
        when(auth.getName()).thenReturn(user.toString());
        when(access.requireProfessional(child, user)).thenThrow(
            new ResponseStatusException(HttpStatus.FORBIDDEN));
        var controller = new PeiController(jdbc, access);
        assertThrows(ResponseStatusException.class, () -> controller.list(child, 2026, 2, auth));
        verifyNoInteractions(jdbc);
    }
}

