package com.sheoran.LostAndFound.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ItemDTO {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000, message = "Please provide a more detailed description")
    private String description;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Type must be specified (LOST or FOUND)")
    private String type;
}