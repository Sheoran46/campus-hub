package com.sheoran.LostAndFound.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private Long messageId;
    private String senderEmail;
    private String senderName;
    private String content;
    private LocalDateTime timestamp;
    private Long relatedItemId;
    private Long relatedMarketItemId;
}