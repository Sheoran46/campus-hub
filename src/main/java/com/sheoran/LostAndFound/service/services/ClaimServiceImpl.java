package com.sheoran.LostAndFound.service.services;


import com.sheoran.LostAndFound.exceptions.ResourceNotFoundException;
import com.sheoran.LostAndFound.model.dto.ClaimRequestDto;
import com.sheoran.LostAndFound.model.dto.ClaimResponseDto;
import com.sheoran.LostAndFound.model.entities.Claim;
import com.sheoran.LostAndFound.model.entities.Item;
import com.sheoran.LostAndFound.model.entities.User;
import com.sheoran.LostAndFound.model.ClaimStatus;
import com.sheoran.LostAndFound.model.ItemStatus;
import com.sheoran.LostAndFound.repositories.ClaimRepository;
import com.sheoran.LostAndFound.repositories.ItemRepository;
import com.sheoran.LostAndFound.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClaimServiceImpl implements ClaimService {

    private final ClaimRepository claimRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public ClaimResponseDto submitClaim(ClaimRequestDto request, String userEmail) {
        User claimer = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        // Penalty Check
        if (claimer.getUnpaidFines() > 0) {
            throw new IllegalStateException("You cannot claim items because you have unpaid penalty fines. Please contact admin.");
        }

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        if (item.getStatus() == ItemStatus.RESOLVED) {
            throw new IllegalStateException("Cannot claim an item that is already resolved.");
        }

        if (claimRepository.existsByItem_ItemIdAndClaimer_Email(item.getItemId(), userEmail)) {
            throw new IllegalStateException("You have already submitted a claim for this item.");
        }

        Claim claim = Claim.builder()
                .item(item)
                .claimer(claimer)
                .proofDescription("Phone: " + request.getPhone() + " | Details: " + request.getProofDescription())
                .status(ClaimStatus.PENDING)
                .build();

        Claim savedClaim = claimRepository.save(claim);
        
        // Update the item status
        item.setStatus(ItemStatus.CLAIM_PENDING);
        itemRepository.save(item);

        // Send email to the person who reported the item
        try {
            String subject = "New Claim Request for your Found Item: " + item.getTitle();
            String message = String.format(
                    "Hello %s,\n\n" +
                    "Good news! Someone believes they are the owner of the item you found ('%s').\n\n" +
                    "Claimer Details:\n" +
                    "- Name: %s\n" +
                    "- Email: %s\n" +
                    "- Proof of Ownership: %s\n\n" +
                    "Please log into Campus Hub to review their claim details and use the In-App Chat to verify their claim and arrange the return.\n\n" +
                    "Thank you for helping our campus community!\nCampus Hub Team",
                    item.getReporter().getName(),
                    item.getTitle(),
                    claimer.getName(),
                    claimer.getEmail(),
                    claim.getProofDescription()
            );

            emailService.sendNotificationEmail(item.getReporter().getEmail(), subject, message);
        } catch (Exception e) {
            // Log the error but don't fail the transaction
            System.err.println("Failed to send claim notification email: " + e.getMessage());
        }

        return mapToDto(savedClaim);
    }

    @Override
    public List<ClaimResponseDto> getUserClaims(String userEmail) {
        return claimRepository.findByClaimer_Email(userEmail).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ClaimResponseDto> getItemClaims(Long itemId) {
        return claimRepository.findByItem_ItemId(itemId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ClaimResponseDto approveClaimByFounder(Long claimId, String founderEmail) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));

        Item item = claim.getItem();

        // Verify that the person approving is actually the one who found/reported the item
        if (!item.getReporter().getEmail().equals(founderEmail)) {
            throw new IllegalStateException("Only the person who reported this item can approve claims for it.");
        }

        claim.setStatus(ClaimStatus.APPROVED);
        Claim updatedClaim = claimRepository.save(claim);

        // Mark item as resolved
        item.setStatus(ItemStatus.RESOLVED);
        itemRepository.save(item);

        // Reject other pending claims for this item
        List<Claim> otherClaims = claimRepository.findByItem_ItemId(item.getItemId());
        for (Claim other : otherClaims) {
            if (!other.getClaimId().equals(claim.getClaimId()) && other.getStatus() == ClaimStatus.PENDING) {
                other.setStatus(ClaimStatus.REJECTED);
                claimRepository.save(other);
            }
        }

        // Notify the claimer
        String subject = "Your Claim has been Approved: " + item.getTitle();
        String message = String.format(
                "Hello %s,\n\n" +
                "Great news! The finder of '%s' has APPROVED your claim.\n\n" +
                "Please coordinate with them to collect your item.\n\n" +
                "Campus Hub Team",
                claim.getClaimer().getName(), item.getTitle()
        );
        try {
            emailService.sendNotificationEmail(claim.getClaimer().getEmail(), subject, message);
        } catch (Exception e) {
            System.err.println("Failed to send approval email: " + e.getMessage());
        }

        return mapToDto(updatedClaim);
    }

    @Override
    @Transactional
    public ClaimResponseDto rejectClaimByFounder(Long claimId, String founderEmail) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));

        Item item = claim.getItem();

        // Verify authorization
        if (!item.getReporter().getEmail().equals(founderEmail)) {
            throw new IllegalStateException("Only the person who reported this item can reject claims for it.");
        }

        claim.setStatus(ClaimStatus.REJECTED);
        Claim updatedClaim = claimRepository.save(claim);

        // If no other pending claims exist, revert item status back to OPEN
        List<Claim> remainingClaims = claimRepository.findByItem_ItemId(item.getItemId());
        boolean hasPending = remainingClaims.stream().anyMatch(c -> c.getStatus() == ClaimStatus.PENDING);
        if (!hasPending) {
            item.setStatus(ItemStatus.OPEN);
            itemRepository.save(item);
        }

        return mapToDto(updatedClaim);
    }

    private ClaimResponseDto mapToDto(Claim claim) {
        return ClaimResponseDto.builder()
                .claimId(claim.getClaimId())
                .itemId(claim.getItem().getItemId())
                .itemTitle(claim.getItem().getTitle())
                .claimerName(claim.getClaimer().getName())
                .claimerEmail(claim.getClaimer().getEmail())
                .proofDescription(claim.getProofDescription())
                .status(claim.getStatus())
                .submittedAt(claim.getSubmittedAt())
                .build();
    }
}