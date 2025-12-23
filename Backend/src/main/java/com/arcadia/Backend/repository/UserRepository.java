package com.arcadia.Backend.repository;

import com.arcadia.Backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

// This interface automatically gives us methods like save(), findAll(), findById()
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}