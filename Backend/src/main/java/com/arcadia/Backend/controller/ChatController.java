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

    public ChatController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    // 🟢 1. Handle Typing Indicators
    // Listens for /app/chat.typing -> Broadcasts to /topic/public
    // logic: We do NOT save "typing..." status to the database.
    @MessageMapping("/chat.typing")
    @SendTo("/topic/public")
    public ChatMessage typing(@Payload ChatMessage chatMessage) {
        return chatMessage;
    }

    // 🟢 2. Handle Normal Chat Messages
    // Listens for /app/chat.sendMessage -> Broadcasts to /topic/public
    // logic: We SAVE these to the database so history works.
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        // Only save actual CHAT messages (ignore JOIN/TYPING)
        if (chatMessage.getType() == ChatMessage.MessageType.CHAT) {
            messageRepository.save(chatMessage);
        }
        return chatMessage;
    }

    // 🟢 3. Handle User Joining
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        // Add username in web socket session
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        return chatMessage;
    }

    // 🟢 4. REST API: Load Chat History
    @GetMapping("/api/messages")
    @ResponseBody
    public List<ChatMessage> getChatHistory() {
        return messageRepository.findByType(ChatMessage.MessageType.CHAT);
    }

    // 🟢 5. Handle Presence Signals (I am here!)
    // Used to sync the sidebar when a new user joins
    @MessageMapping("/chat.presence")
    @SendTo("/topic/public")
    public ChatMessage presence(@Payload ChatMessage chatMessage) {
        return chatMessage;
    }
}