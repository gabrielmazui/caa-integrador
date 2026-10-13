package com.example.demo.ops;

import com.example.demo.auth.JwtAuthenticationFilter;
import com.example.demo.auth.JwtService;
import com.example.demo.auth.UsuarioDetailsService;
import com.example.demo.config.SecurityConfig;
import com.example.demo.shared.ApiErrorController;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

@SpringBootTest(classes = OperationalEndpointsTest.App.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {"spring.flyway.enabled=false"})
class OperationalEndpointsTest {
    @Value("${local.server.port}") int port;
    @Autowired JwtService jwt;
    @Autowired AtomicBoolean databaseUp;
    private final HttpClient client = HttpClient.newHttpClient();

    @AfterEach void restoreDatabase() { databaseUp.set(true); }

    HttpResponse<String> get(String path, boolean authenticated) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (authenticated) request.header("Authorization", "Bearer " + jwt.create(UUID.randomUUID()));
        return client.send(request.GET().build(), HttpResponse.BodyHandlers.ofString());
    }

    @Test void healthIsPublicAndDoesNotExposeDetails() throws Exception {
        for (String path : new String[]{"/api/health", "/api/health/liveness", "/api/health/readiness"}) {
            var response = get(path, false);
            assertEquals(200, response.statusCode(), path);
            assertTrue(response.body().contains("\"status\":\"UP\""), path);
            assertFalse(response.body().contains("components"), path);
            assertFalse(response.body().contains("details"), path);
        }
    }

    @Test void databaseFailureAffectsReadinessButNotLiveness() throws Exception {
        databaseUp.set(false);
        assertEquals(503, get("/api/health/readiness", false).statusCode());
        assertEquals(503, get("/api/health", false).statusCode());
        assertEquals(200, get("/api/health/liveness", false).statusCode());
        assertFalse(get("/api/health/readiness", true).body().contains("private-db-details"));
    }

    @Test void infoRequiresAuthenticationAndContainsBuild() throws Exception {
        assertEquals(401, get("/api/info", false).statusCode());
        var response = get("/api/info", true);
        assertEquals(200, response.statusCode());
        assertTrue(response.body().contains("\"version\""));
    }

    @Test void diagnosticsAreNotExposedByDefault() throws Exception {
        for (String path : new String[]{"/api/metrics", "/api/mappings", "/api/env", "/api/heapdump", "/api/shutdown"}) {
            assertEquals(404, get(path, true).statusCode(), path);
        }
    }

    @Test void errorsReturnJsonInsteadOfWhitelabel() throws Exception {
        assertJsonError(get("/error", false), 404, "Recurso não encontrado");
        assertJsonError(get("/rota-que-nao-existe", false), 401, "Não autorizado");
        assertJsonError(get("/rota-que-nao-existe", true), 404, "Recurso não encontrado");
    }

    private void assertJsonError(HttpResponse<String> response, int status, String message) {
        assertEquals(status, response.statusCode());
        assertTrue(response.headers().firstValue("content-type").orElse("")
            .startsWith("application/json"));
        assertTrue(response.body().contains("\"message\":\"" + message + "\""));
        assertFalse(response.body().contains("Whitelabel Error Page"));
    }

    @SpringBootConfiguration
    @EnableAutoConfiguration(excludeName = "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration")
    @Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        ApiErrorController.class})
    static class App {
        @Bean UsuarioDetailsService users() { return mock(UsuarioDetailsService.class); }
        @Bean AtomicBoolean databaseUp() { return new AtomicBoolean(true); }
        @Bean(name = "db") HealthIndicator database(AtomicBoolean databaseUp) {
            return () -> databaseUp.get() ? Health.up().build()
                : Health.down().withDetail("reason", "private-db-details").build();
        }
    }
}
