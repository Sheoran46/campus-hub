package com.sheoran.LostAndFound.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BuyRequestDto {
    @NotBlank(message = "Phone number is required")
    private String phone;

    private String extraDetails;
}