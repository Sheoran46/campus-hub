package com.sheoran.LostAndFound.service.services;


import com.sheoran.LostAndFound.model.dto.ClaimRequestDto;
import com.sheoran.LostAndFound.model.dto.ClaimResponseDto;
import java.util.List;

public interface ClaimService {
    ClaimResponseDto submitClaim(ClaimRequestDto request, String userEmail);
    List<ClaimResponseDto> getUserClaims(String userEmail);
    List<ClaimResponseDto> getItemClaims(Long itemId);
    ClaimResponseDto approveClaimByFounder(Long claimId, String founderEmail);
    ClaimResponseDto rejectClaimByFounder(Long claimId, String founderEmail);
}