package com.sheoran.LostAndFound.model.entities;

import com.sheoran.LostAndFound.model.ClaimStatus;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "claims")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long claimId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claimer_id", nullable = false)
    private User claimer;

    @Column(nullable = false, length = 1000)
    private String proofDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClaimStatus status; // Enum: PENDING, APPROVED, REJECTED, FRAUDULENT

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();
}