package com.sheoran.LostAndFound.repositories;

import com.sheoran.LostAndFound.model.MarketStatus;
import com.sheoran.LostAndFound.model.entities.MarketplaceItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface MarketplaceItemRepository extends JpaRepository<MarketplaceItem, Long> {

    // Pagination built-in for fetching items
    Page<MarketplaceItem> findByStatus(MarketStatus status, Pageable pageable);

    // Custom search query for keywords
    @Query("SELECT m FROM MarketplaceItem m WHERE LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<MarketplaceItem> searchByKeyword(String keyword, Pageable pageable);
}