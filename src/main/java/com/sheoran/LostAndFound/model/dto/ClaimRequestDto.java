package com.sheoran.LostAndFound.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ClaimRequestDto {
    @NotNull(message = "Item ID is required")
    private Long itemId;

    @NotBlank(message = "Proof description cannot be empty")
    private String proofDescription;

    @NotBlank(message = "Phone number is required")
    private String phone;
}