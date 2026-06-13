package com.sheoran.LostAndFound.model.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "item_images")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ItemImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long imageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marketplace_id")
    private MarketplaceItem marketplaceItem;

    @Column(nullable = false, length = 1000)
    private String imageUrl;

    // FIX: Add the missing publicId field here
    @Column(nullable = false)
    private String publicId;
}