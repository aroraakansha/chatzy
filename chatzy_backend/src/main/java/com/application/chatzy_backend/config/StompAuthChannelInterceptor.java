package com.application.chatzy_backend.config;

import com.application.chatzy_backend.auth.JwtTokenProvider;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;
import org.springframework.messaging.support.MessageHeaderAccessor;

import java.security.Principal;
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger logger =
            LoggerFactory.getLogger(StompAuthChannelInterceptor.class);
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                message, StompHeaderAccessor.class
        );

        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message; // pass through non-CONNECT frames unchanged
        }

        logger.info("WebSocket CONNECT request received");

        String authHeader = accessor.getFirstNativeHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.error("Missing or malformed Authorization header");
            throw new MessagingException("Missing Authorization header");
        }

        String token = authHeader.substring(7).trim();

        try {
            String userId = jwtTokenProvider.validateTokenAndGetSubject(token);
            logger.info("JWT validated. User: {}", userId);

            // ✅ This now actually works because we used getAccessor()
            accessor.setUser((Principal) () -> userId);

        } catch (JwtException e) {
            logger.error("JWT validation failed: {}", e.getMessage());
            throw new MessagingException("Invalid or expired JWT: " + e.getMessage());
        }

        return message;
    }
}