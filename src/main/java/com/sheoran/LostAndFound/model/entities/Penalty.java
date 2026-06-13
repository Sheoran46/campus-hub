package com.sheoran.LostAndFound.model.entities;

import com.sheoran.LostAndFound.model.PenaltyStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "penalties")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Penalty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long penaltyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id")
    private Claim relatedClaim;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PenaltyStatus status; // Enum: UNPAID, PAID

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime issuedAt = LocalDateTime.now();
}