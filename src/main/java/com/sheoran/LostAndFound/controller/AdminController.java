package com.sheoran.LostAndFound.controller;


import com.sheoran.LostAndFound.model.ClaimStatus;
import com.sheoran.LostAndFound.model.dto.ClaimResponseDto;
import com.sheoran.LostAndFound.service.services.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/claims/pending")
    public ResponseEntity<List<ClaimResponseDto>> getPendingClaims() {
        return ResponseEntity.ok(adminService.getPendingClaims());
    }

    @PatchMapping("/claims/{claimId}/review")
    public ResponseEntity<ClaimResponseDto> reviewClaim(
            @PathVariable Long claimId, 
            @RequestParam ClaimStatus status,
            Authentication authentication) {
        return ResponseEntity.ok(adminService.reviewClaim(claimId, status, authentication.getName()));
    }

    @PatchMapping("/penalties/{penaltyId}/waive")
    public ResponseEntity<?> waivePenalty(@PathVariable Long penaltyId, Authentication authentication) {
        adminService.waivePenalty(penaltyId, authentication.getName());
        return ResponseEntity.ok().build();
    }
    
    @PatchMapping("/users/{userId}/waive-all")
    public ResponseEntity<?> waiveAllPenalties(@PathVariable Long userId, Authentication authentication) {
        adminService.waiveAllPenaltiesForUser(userId, authentication.getName());
        return ResponseEntity.ok().build();
    }
}