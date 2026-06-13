package com.sheoran.LostAndFound.repositories;

import com.sheoran.LostAndFound.model.entities.Claim;
import com.sheoran.LostAndFound.model.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByItem_ItemId(Long itemId);
    List<Claim> findByClaimer_Email(String email);
    boolean existsByItem_ItemIdAndClaimer_Email(Long itemId, String email);
    
    // Count how many false claims a user has made
    long countByClaimer_EmailAndStatus(String email, ClaimStatus status);
    
    // For Admin to see pending claims
    List<Claim> findByStatus(ClaimStatus status);
}