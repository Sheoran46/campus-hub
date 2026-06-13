package com.sheoran.LostAndFound.model.dto;

import com.sheoran.LostAndFound.model.ClaimStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ClaimResponseDto {
    private Long claimId;
    private Long itemId;
    private String itemTitle;
    private String claimerName;
    private String claimerEmail; // Added to facilitate contact
    private String proofDescription;
    private ClaimStatus status;
    private LocalDateTime submittedAt;
}