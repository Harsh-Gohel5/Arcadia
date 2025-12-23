package com.arcadia.Backend.controller;

import com.arcadia.Backend.model.ChatMessage;
import com.arcadia.Backend.repository.MessageRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
@CrossOrigin(origins = "http://localhost:3000")
public class ChatController {

    private final MessageRepository messageRepository;

    // 1. Dependency Injection: We ask Spring to give us the Repository tool
    public ChatController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    // 2. WebSocket: Handle sending messages
    // 2. WebSocket: Handle sending messages
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        
        // 🔍 DEBUG LOGS: Print what we received
        System.out.println("---------- MESSAGE RECEIVED ----------");
        System.out.println("Content: " + chatMessage.getContent());
        System.out.println("Sender: " + chatMessage.getSender());
        System.out.println("Type: " + chatMessage.getType());

        // SAVE to Database
        if (chatMessage.getType() == ChatMessage.MessageType.CHAT) {
            System.out.println("✅ Saving to Database...");
            try {
                messageRepository.save(chatMessage);
                System.out.println("✅ Save Success!");
            } catch (Exception e) {
                System.out.println("❌ Save FAILED: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("⚠️ Not saving because Type is: " + chatMessage.getType());
        }
        System.out.println("--------------------------------------");

        return chatMessage;
    }
    // 3. WebSocket: Handle new user joining
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        return chatMessage;
    }

    // 4. REST API: Load Chat History (New Feature!)
    @GetMapping("/api/messages")
    @ResponseBody // Tells Spring to send the data as JSON, not a HTML page
    public List<ChatMessage> getChatHistory() {
        return messageRepository.findByType(ChatMessage.MessageType.CHAT);
    }
}