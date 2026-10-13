package com.example.demo.ops;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.ActiveProfiles;
import static org.junit.jupiter.api.Assertions.*;

@ActiveProfiles("dev")
class DevelopmentEndpointsTest extends OperationalEndpointsTest {
    @Override
    @Test void diagnosticsAreNotExposedByDefault() throws Exception {
        for (String path : new String[]{"/api/metrics", "/api/metrics/jvm.memory.used", "/api/mappings"}) {
            assertEquals(401, get(path, false).statusCode(), path);
            assertEquals(200, get(path, true).statusCode(), path);
        }
        for (String path : new String[]{"/api/env", "/api/heapdump", "/api/shutdown"}) {
            assertEquals(404, get(path, true).statusCode(), path);
        }
    }
}
