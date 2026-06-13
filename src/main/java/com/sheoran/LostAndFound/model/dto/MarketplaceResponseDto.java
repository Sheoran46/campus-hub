package com.sheoran.LostAndFound.model.dto;


import com.sheoran.LostAndFound.model.MarketStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MarketplaceResponseDto {
    private Long marketId;
    private String sellerName;
    private String sellerEmail; // Added for contact
    private String title;
    private String description;
    private Double askingPrice;
    private Integer quantity;
    private Double aiNewPriceEstimate;
    private String aiProfitAnalysis;
    private MarketStatus status;
    private List<String> imageUrls;
}