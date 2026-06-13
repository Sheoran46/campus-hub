package com.sheoran.LostAndFound.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MarketplaceItemResponse {
    private Long marketId;
    private String sellerName; // Notice we only send the name, not the whole User entity
    private String title;
    private String description;
    private Double askingPrice;
    private Double aiNewPriceEstimate;
    private String aiProfitAnalysis;
    private String status;
}