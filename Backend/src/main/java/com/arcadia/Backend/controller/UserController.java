package com.arcadia.Backend.controller;

import com.arcadia.Backend.model.User;
import com.arcadia.Backend.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000") // Allow Frontend
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public User login(@RequestBody User user) {
        // Try to find the user in the DB. If not found, create a new one.
        return userRepository.findByUsername(user.getUsername())
                .orElseGet(() -> userRepository.save(new User(user.getUsername())));
    }
}