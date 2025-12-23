package com.arcadia.Backend.repository;

import com.arcadia.Backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<ChatMessage, Long> {
    // This automatically creates a SQL query to find messages by type
    List<ChatMessage> findByType(ChatMessage.MessageType type);
}