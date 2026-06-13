package com.sheoran.LostAndFound.model.dto;

import com.sheoran.LostAndFound.model.ItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemRequestDto {
    @NotNull(message = "Item type (LOST/FOUND) is required")
    private ItemType type;

    @NotBlank(message = "Title cannot be blank")
    private String title;

    private String description;

    @NotBlank(message = "Location is required")
    private String location;
    
    private String contactPhone;
}