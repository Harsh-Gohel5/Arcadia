package com.arcadia.Backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity // 1. Tells Spring this class represents a Database Table
@Table(name = "messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;
    private String sender;

    @Enumerated(EnumType.STRING) // 2. Stores "CHAT" as text, not a number
    private MessageType type;

    private LocalDateTime timestamp;

    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE,
        TYPING,
        PRESENCE
    }

    // Default Constructor (Required by JPA/Database)
    public ChatMessage() {
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}