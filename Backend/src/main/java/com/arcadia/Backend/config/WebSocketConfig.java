package com.arcadia.Backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // This enables a simple memory-based message broker to send messages back to clients
        config.enableSimpleBroker("/topic");
        // Messages sent from clients with destination starting with "/app" will be routed to our message handling methods
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // This is the "Door" that the Frontend will knock on to connect
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow our frontend to connect
                .withSockJS(); // Enable fallback options if WebSocket is blocked
    }
}