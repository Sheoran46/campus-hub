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
public class ContactDto {
    private String email;
    private String name;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
}