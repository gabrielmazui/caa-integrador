package com.example.demo.auth;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UsuarioDetailsService implements UserDetailsService {
    private final JdbcClient jdbc;

    public UsuarioDetailsService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return jdbc.sql("""
                SELECT email, senha_hash, ativo
                FROM usuarios
                WHERE lower(email) = lower(:email) AND excluido_em IS NULL
                """)
            .param("email", email.trim())
            .query((rs, row) -> User.withUsername(rs.getString("email"))
                .password(rs.getString("senha_hash"))
                .disabled(!rs.getBoolean("ativo"))
                .authorities("USUARIO")
                .build())
            .optional()
            .orElseThrow(() -> new UsernameNotFoundException("Credenciais inválidas"));
    }
}
