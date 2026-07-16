package com.arjun.crm.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;
import java.util.List;

/**
 * WebSocket Configuration
 * Configures STOMP messaging over WebSocket for real-time communication
 * 
 * CRITICAL: Uses environment-driven allowed origins via WEBSOCKET_ALLOWED_ORIGINS
 * to ensure Access-Control-Allow-Credentials: true is properly emitted for SockJS.
 * 
 * Features:
 * - STOMP protocol support
 * - SockJS fallback for browsers without WebSocket support
 * - Topic-based broadcasting
 * - User-specific queues
 * - Proper CORS credentials support
 * - Environment-driven origin configuration (production-ready)
 * 
 * Endpoints:
 * - /ws - WebSocket connection endpoint
 * 
 * Destinations:
 * - /topic/* - Broadcast to all subscribers
 * - /queue/* - Point-to-point messaging
 * - /user/queue/* - User-specific messages
 * 
 * Configuration:
 * WEBSOCKET_ALLOWED_ORIGINS environment variable (comma-separated)
 * Example for production: https://taskflow-ai-ochre.vercel.app,wss://taskflow-domain.com
 * 
 * @author CRM Backend Team
 * @version 2.0 - Environment-driven CORS (production-ready)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor;

    /**
     * Reads WebSocket allowed origins from environment variable.
     * Comma-separated list of origins that are allowed to connect.
     * Default: localhost development origins + production URLs
     * 
     * CRITICAL: Must include both HTTP and HTTPS variants, and explicit domains.
     * Examples:
     * - http://localhost:3000,http://localhost:5173,https://taskflow-ai-ochre.vercel.app
     * - https://app.example.com,wss://app.example.com (if using WSS directly)
     */
    @Value("${websocket.allowed-origins:http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:8081,https://taskflow-ai-ochre.vercel.app}")
    private String allowedOriginsRaw;

    /**
     * Configure message broker
     * Sets up in-memory STOMP broker
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Use simple in-memory message broker
        config.enableSimpleBroker("/topic", "/queue");
        
        // Prefix for messages from client to server
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefix for user-specific messages
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Register STOMP endpoints
     * Configures WebSocket connection endpoints with SockJS fallback
     * 
     * CRITICAL: Using setAllowedOrigins() with explicit origins (NOT "*", NOT patterns)
     * ensures Spring automatically sets Access-Control-Allow-Credentials: true
     * which is REQUIRED for SockJS /ws/info endpoint to work properly.
     * 
     * Origins are loaded from WEBSOCKET_ALLOWED_ORIGINS environment variable
     * and include both HTTP (development) and HTTPS (production) URLs.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Parse comma-separated origins from environment variable
        List<String> allowedOrigins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        // Convert to array for setAllowedOrigins()
        String[] originsArray = allowedOrigins.toArray(new String[0]);

        // Register STOMP endpoint with SockJS fallback
        // Origins from environment variable support production HTTPS URLs
        registry.addEndpoint("/ws")
                .setAllowedOrigins(originsArray)
                .withSockJS();
    }

    /**
     * Register the JWT channel interceptor so every STOMP CONNECT frame
     * is authenticated and the session Principal is set correctly.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthChannelInterceptor);
    }
}
