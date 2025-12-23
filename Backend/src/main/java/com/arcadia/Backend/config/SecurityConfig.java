package com.arcadia.Backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) 
            .authorizeHttpRequests(auth -> auth
                // 🟢 Allow Health Check, Login, AND WebSockets
                .requestMatchers("/api/health", "/api/users/login", "/ws/**").permitAll() 
                .anyRequest().authenticated()
            );
        return http.build();
    }
}