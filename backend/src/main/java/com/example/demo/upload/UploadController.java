package com.example.demo.upload;

import com.example.demo.shared.CurrentUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private static final long MAX_BYTES = 50 * 1024 * 1024; // 50 MB
    private static final List<String> ALLOWED_MIME_PREFIXES =
        List.of("image/", "audio/", "video/", "application/pdf",
                "application/msword", "application/vnd.", "text/plain");

    private final JdbcClient jdbc;
    private final Path uploadsDir;

    public UploadController(JdbcClient jdbc,
                            @Value("${app.uploads.dir:/var/uploads}") String uploadsDir) {
        this.jdbc = jdbc;
        this.uploadsDir = Path.of(uploadsDir);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ArquivoResponse upload(@RequestParam("file") MultipartFile file,
                                  Authentication auth) {
        if (file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo vazio");
        if (file.getSize() > MAX_BYTES) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Arquivo muito grande (máx 50 MB)");

        String mime = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        if (ALLOWED_MIME_PREFIXES.stream().noneMatch(mime::startsWith)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Tipo de arquivo não suportado");
        }

        String tipo = detectTipo(mime);
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "arquivo";
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
        String filename = UUID.randomUUID() + ext;
        String url = "/api/uploads/" + filename;

        try {
            Files.createDirectories(uploadsDir);
            Files.copy(file.getInputStream(), uploadsDir.resolve(filename));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao salvar arquivo");
        }

        UUID id = UUID.randomUUID();
        jdbc.sql("""
                INSERT INTO arquivos (id, url, nome_arquivo, mime_type, tamanho_bytes, tipo, uploader_id)
                VALUES (:id, :url, :nome, :mime, :tamanho, :tipo, :uploader)
                """)
            .param("id", id).param("url", url).param("nome", original)
            .param("mime", mime).param("tamanho", file.getSize())
            .param("tipo", tipo).param("uploader", CurrentUser.id(auth))
            .update();

        return new ArquivoResponse(id, url, original, tipo, mime, file.getSize());
    }

    private String detectTipo(String mime) {
        if (mime.startsWith("image/")) return "imagem";
        if (mime.startsWith("audio/")) return "audio";
        if (mime.startsWith("video/")) return "video";
        return "documento";
    }

    public record ArquivoResponse(UUID id, String url, String nomeArquivo, String tipo,
                                  String mimeType, long tamanhoBytes) {}
}
