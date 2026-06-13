package com.sheoran.LostAndFound.controller;

import com.sheoran.LostAndFound.model.dto.ChatMessageDto;
import com.sheoran.LostAndFound.service.services.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    /**
     * Handles real-time messages sent from the frontend via WebSocket.
     * The frontend sends to: /app/chat
     */
    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessageDto chatMessageDto, Authentication authentication) {
        // 1. Ensure the sender is actually the authenticated user (security measure)
        chatMessageDto.setSenderEmail(authentication.getName());

        // 2. Save the message to the database
        ChatMessageDto savedMessage = chatService.saveMessage(chatMessageDto);

        // 3. Broadcast the message to everyone subscribed to the public topic
        messagingTemplate.convertAndSend("/topic/public", savedMessage);
    }

    /**
     * REST endpoint to load the global chat history.
     * Restricted to fetching only the last 200 messages as per requirements.
     */
    @GetMapping("/api/chat/history")
    public ResponseEntity<List<ChatMessageDto>> getChatHistory() {
        List<ChatMessageDto> history = chatService.getGlobalChatHistory();
        return ResponseEntity.ok(history);
    }
}