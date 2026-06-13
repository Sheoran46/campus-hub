package com.sheoran.LostAndFound.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClaimRequestEmailDto {
    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Proof description is required")
    private String proofDescription;
}