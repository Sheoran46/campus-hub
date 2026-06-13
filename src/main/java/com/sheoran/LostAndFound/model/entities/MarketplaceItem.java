package com.sheoran.LostAndFound.model.entities;
import com.sheoran.LostAndFound.model.MarketStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "marketplace_items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MarketplaceItem {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long marketId;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "seller_id", nullable = false)
        private User seller;

        @Column(nullable = false)
        private String title;

        @Column(length = 1000)
        private String description;

        @Column(nullable = false)
        private Double askingPrice;
        
        @Column(nullable = false)
        @Builder.Default
        private Integer quantity = 1;

        // AI Generated Fields
        private Double aiNewPriceEstimate;

        @Column(length = 500)
        private String aiProfitAnalysis;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private MarketStatus status; // Enum: AVAILABLE, SOLD
}