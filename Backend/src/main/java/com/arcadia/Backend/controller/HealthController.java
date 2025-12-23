package com.arcadia.Backend.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:3000") // 🟢 IMPORTANT: This allows Next.js to talk to us!
public class HealthController {

    @GetMapping("/api/health")
    public String checkHealth() {
        return "Arcadia Backend is Running & Connected to AWS!";
    }
}