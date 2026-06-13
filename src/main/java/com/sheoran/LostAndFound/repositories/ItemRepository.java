package com.sheoran.LostAndFound.repositories;


import com.sheoran.LostAndFound.model.entities.Item;
import com.sheoran.LostAndFound.model.ItemStatus;
import com.sheoran.LostAndFound.model.ItemType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    // Scalable pagination for filtering by Type (Lost/Found) and Status
    // Handles null values for type and status to return all items if no filters are applied
    @Query("SELECT i FROM Item i WHERE (:type IS NULL OR i.type = :type) AND (:status IS NULL OR i.status = :status)")
    Page<Item> findByTypeAndStatus(@Param("type") ItemType type, @Param("status") ItemStatus status, Pageable pageable);

    // Smart Search for keywords in both Title and Description
    @Query("SELECT i FROM Item i WHERE LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Item> searchItemsByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // Find all recent OPEN items of a specific type to match against
    List<Item> findByTypeAndStatusOrderByDateReportedDesc(ItemType type, ItemStatus status);
}