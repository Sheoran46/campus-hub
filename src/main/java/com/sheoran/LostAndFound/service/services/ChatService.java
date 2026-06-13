package com.sheoran.LostAndFound.service.services;

import com.sheoran.LostAndFound.model.dto.ChatMessageDto;

import java.util.List;

public interface ChatService {
    ChatMessageDto saveMessage(ChatMessageDto chatMessageDto);
    List<ChatMessageDto> getGlobalChatHistory();
}