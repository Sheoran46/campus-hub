package com.sheoran.LostAndFound.model.dto;

import com.sheoran.LostAndFound.model.ItemStatus;
import com.sheoran.LostAndFound.model.ItemType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ItemResponseDto {
    private Long itemId;
    private String reporterName;
    private String reporterEmail; 
    private String contactPhone; // Added contact phone
    private ItemType type;
    private String title;
    private String description;
    private String location;
    private LocalDateTime dateReported;
    private ItemStatus status;
    private List<String> imageUrls;
}