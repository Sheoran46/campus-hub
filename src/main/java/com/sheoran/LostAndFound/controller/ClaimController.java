package com.sheoran.LostAndFound.controller;


import com.sheoran.LostAndFound.model.dto.ClaimRequestDto;
import com.sheoran.LostAndFound.model.dto.ClaimResponseDto;
import com.sheoran.LostAndFound.service.services.ClaimService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping
    public ResponseEntity<?> submitClaim(
            @Valid @RequestBody ClaimRequestDto request,
            Authentication authentication
    ) {
        try {
            String userEmail = authentication.getName();
            ClaimResponseDto response = claimService.submitClaim(request, userEmail);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/my-claims")
    public ResponseEntity<List<ClaimResponseDto>> getMyClaims(Authentication authentication) {
        String userEmail = authentication.getName();
        List<ClaimResponseDto> claims = claimService.getUserClaims(userEmail);
        return ResponseEntity.ok(claims);
    }

    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<ClaimResponseDto>> getItemClaims(@PathVariable Long itemId) {
        List<ClaimResponseDto> claims = claimService.getItemClaims(itemId);
        return ResponseEntity.ok(claims);
    }

    // Endpoints for the founder to approve/reject claims directly
    @PatchMapping("/{claimId}/approve")
    public ResponseEntity<?> approveClaim(@PathVariable Long claimId, Authentication authentication) {
        try {
            ClaimResponseDto response = claimService.approveClaimByFounder(claimId, authentication.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PatchMapping("/{claimId}/reject")
    public ResponseEntity<?> rejectClaim(@PathVariable Long claimId, Authentication authentication) {
        try {
            ClaimResponseDto response = claimService.rejectClaimByFounder(claimId, authentication.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}