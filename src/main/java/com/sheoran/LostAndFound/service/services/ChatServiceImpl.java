package com.sheoran.LostAndFound.service.services;

import com.sheoran.LostAndFound.exceptions.ResourceNotFoundException;
import com.sheoran.LostAndFound.model.dto.ChatMessageDto;
import com.sheoran.LostAndFound.model.entities.ChatMessage;
import com.sheoran.LostAndFound.model.entities.Item;
import com.sheoran.LostAndFound.model.entities.MarketplaceItem;
import com.sheoran.LostAndFound.model.entities.User;
import com.sheoran.LostAndFound.repositories.ChatMessageRepository;
import com.sheoran.LostAndFound.repositories.ItemRepository;
import com.sheoran.LostAndFound.repositories.MarketplaceItemRepository;
import com.sheoran.LostAndFound.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final MarketplaceItemRepository marketplaceItemRepository;

    @Override
    public ChatMessageDto saveMessage(ChatMessageDto chatMessageDto) {
        User sender = userRepository.findByEmail(chatMessageDto.getSenderEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));

        Item relatedItem = null;
        if (chatMessageDto.getRelatedItemId() != null) {
            relatedItem = itemRepository.findById(chatMessageDto.getRelatedItemId()).orElse(null);
        }

        MarketplaceItem relatedMarketItem = null;
        if (chatMessageDto.getRelatedMarketItemId() != null) {
            relatedMarketItem = marketplaceItemRepository.findById(chatMessageDto.getRelatedMarketItemId()).orElse(null);
        }

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                // Receiver is no longer strictly required for public chat, but we left the field. 
                // We'll just leave it null if it's a global chat.
                .content(chatMessageDto.getContent())
                .relatedItem(relatedItem)
                .relatedMarketItem(relatedMarketItem)
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);
        return mapToDto(savedMessage);
    }

    @Override
    public List<ChatMessageDto> getGlobalChatHistory() {
        // Fetch ONLY the last 200 messages to reduce server load as requested
        Page<ChatMessage> messagePage = chatMessageRepository.findGlobalChatHistory(PageRequest.of(0, 200));

        List<ChatMessageDto> history = messagePage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        // Reverse the list so the oldest of the 200 messages is first, and the newest is last (standard chat view)
        Collections.reverse(history);
        return history;
    }

    private ChatMessageDto mapToDto(ChatMessage message) {
        return ChatMessageDto.builder()
                .messageId(message.getMessageId())
                .senderEmail(message.getSender().getEmail())
                .senderName(message.getSender().getName())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .relatedItemId(message.getRelatedItem() != null ? message.getRelatedItem().getItemId() : null)
                .relatedMarketItemId(message.getRelatedMarketItem() != null ? message.getRelatedMarketItem().getMarketId() : null)
                .build();
    }
}