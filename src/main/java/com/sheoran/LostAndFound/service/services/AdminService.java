package com.sheoran.LostAndFound.service.services;

import com.sheoran.LostAndFound.model.ClaimStatus;
import com.sheoran.LostAndFound.model.dto.ClaimResponseDto;
import java.util.List;

public interface AdminService {
    List<ClaimResponseDto> getPendingClaims();
    ClaimResponseDto reviewClaim(Long claimId, ClaimStatus status, String adminEmail);
    void waivePenalty(Long penaltyId, String adminEmail);
    void waiveAllPenaltiesForUser(Long userId, String adminEmail);
}