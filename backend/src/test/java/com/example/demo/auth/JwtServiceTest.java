package com.example.demo.auth;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {
    private static final String SECRET = "uma-chave-de-testes-com-mais-de-32-bytes";

    @Test
    void createsAndReadsToken() {
        var service = new JwtService(SECRET, 60);
        UUID userId = UUID.randomUUID();

        String token = service.create(userId);

        assertEquals(userId, service.subject(token));
        assertEquals(3600, service.expiresInSeconds());
    }

    @Test
    void rejectsTokenSignedWithAnotherKey() {
        var service = new JwtService(SECRET, 60);
        var another = new JwtService("outra-chave-segura-com-mais-de-trinta-e-dois-bytes", 60);

        assertThrows(RuntimeException.class, () -> service.subject(another.create(UUID.randomUUID())));
    }
}
