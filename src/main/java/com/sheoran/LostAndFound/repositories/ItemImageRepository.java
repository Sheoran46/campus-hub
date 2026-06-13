package com.sheoran.LostAndFound.repositories;

import com.sheoran.LostAndFound.model.entities.ItemImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ItemImageRepository extends JpaRepository<ItemImage, Long> {
    List<ItemImage> findByItem_ItemId(Long itemId);

    List<ItemImage> findByMarketplaceItem_MarketId(Long marketId);
}