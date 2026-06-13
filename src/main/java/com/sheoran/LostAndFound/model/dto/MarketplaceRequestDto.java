package com.sheoran.LostAndFound.model.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class MarketplaceRequestDto {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Asking price is required")
    @Positive(message = "Price must be greater than zero")
    private Double askingPrice;

    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity = 1;

    // Razorpay payment details required to authorize the listing
    @NotBlank(message = "Razorpay Order ID is required")
    private String razorpayOrderId;

    @NotBlank(message = "Razorpay Payment ID is required")
    private String razorpayPaymentId;

    @NotBlank(message = "Razorpay Signature is required")
    private String razorpaySignature;
}