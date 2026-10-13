package com.example.demo.shared;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
public class ApiErrorController implements ErrorController {
    @RequestMapping("/error")
    public ResponseEntity<ErrorResponse> error(HttpServletRequest request) {
        HttpStatus status = resolveStatus(request);
        String originalPath = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);

        return ResponseEntity.status(status).body(new ErrorResponse(
            Instant.now(),
            status.value(),
            messageFor(status),
            originalPath != null ? originalPath : request.getRequestURI()
        ));
    }

    private HttpStatus resolveStatus(HttpServletRequest request) {
        Object statusCode = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        if (statusCode instanceof Integer code) {
            HttpStatus status = HttpStatus.resolve(code);
            if (status != null) return status;
        }
        return HttpStatus.NOT_FOUND;
    }

    private String messageFor(HttpStatus status) {
        return switch (status) {
            case NOT_FOUND -> "Recurso não encontrado";
            case UNAUTHORIZED -> "Não autorizado";
            case FORBIDDEN -> "Acesso negado";
            case METHOD_NOT_ALLOWED -> "Método não permitido";
            default -> status.is5xxServerError()
                ? "Erro interno do servidor"
                : "Não foi possível processar a requisição";
        };
    }

    public record ErrorResponse(Instant timestamp, int status, String message, String path) {}
}
