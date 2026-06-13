package com.sheoran.LostAndFound.service.services;

import com.sheoran.LostAndFound.exceptions.ResourceNotFoundException;
import com.sheoran.LostAndFound.model.ClaimStatus;
import com.sheoran.LostAndFound.model.ItemStatus;
import com.sheoran.LostAndFound.model.PenaltyStatus;
import com.sheoran.LostAndFound.model.Role;
import com.sheoran.LostAndFound.model.dto.ClaimResponseDto;
import com.sheoran.LostAndFound.model.entities.Claim;
import com.sheoran.LostAndFound.model.entities.Item;
import com.sheoran.LostAndFound.model.entities.Penalty;
import com.sheoran.LostAndFound.model.entities.User;
import com.sheoran.LostAndFound.repositories.ClaimRepository;
import com.sheoran.LostAndFound.repositories.ItemRepository;
import com.sheoran.LostAndFound.repositories.PenaltyRepository;
import com.sheoran.LostAndFound.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final ClaimRepository claimRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final PenaltyRepository penaltyRepository;
    private final EmailService emailService;

    @Override
    public List<ClaimResponseDto> getPendingClaims() {
        return claimRepository.findByStatus(ClaimStatus.PENDING).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ClaimResponseDto reviewClaim(Long claimId, ClaimStatus status, String adminEmail) {
        verifyAdmin(adminEmail);

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));

        claim.setStatus(status);
        Claim updatedClaim = claimRepository.save(claim);

        User claimer = claim.getClaimer();
        Item item = claim.getItem();

        if (status == ClaimStatus.APPROVED) {
            // Notify claimer
            String subject = "Claim Approved: " + item.getTitle();
            String message = String.format(
                    "Hello %s,\n\n" +
                    "Your claim for the item '%s' has been APPROVED by the campus administration.\n\n" +
                    "Please contact the finder to collect your item:\n" +
                    "Finder Name: %s\n" +
                    "Finder Email: %s\n\n" +
                    "Thank you,\nCampus Hub Admin",
                    claimer.getName(), item.getTitle(), item.getReporter().getName(), item.getReporter().getEmail()
            );
            emailService.sendNotificationEmail(claimer.getEmail(), subject, message);

            // Item is now resolved
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
        } 
        else if (status == ClaimStatus.FRAUDULENT) {
            // Check if user has 3 or more fraudulent claims
            long fraudCount = claimRepository.countByClaimer_EmailAndStatus(claimer.getEmail(), ClaimStatus.FRAUDULENT);
            
            if (fraudCount >= 3) { // This is the 3rd one
                double penaltyAmount = 100.0;
                
                Penalty penalty = Penalty.builder()
                        .user(claimer)
                        .relatedClaim(claim)
                        .amount(penaltyAmount)
                        .reason("Exceeded maximum allowed fraudulent claims (3 or more).")
                        .status(PenaltyStatus.UNPAID)
                        .build();
                penaltyRepository.save(penalty);
                
                claimer.setUnpaidFines(claimer.getUnpaidFines() + penaltyAmount);
                userRepository.save(claimer);
                
                String subject = "Account Penalty Notice";
                String message = String.format(
                        "Hello %s,\n\n" +
                        "Your recent claim for '%s' was marked as FRAUDULENT by administration.\n" +
                        "As this is your 3rd (or more) false claim, a penalty of ₹%.2f has been applied to your account.\n" +
                        "You will not be able to claim any more items until this penalty is cleared by an admin.\n\n" +
                        "Campus Hub Admin",
                        claimer.getName(), item.getTitle(), penaltyAmount
                );
                emailService.sendNotificationEmail(claimer.getEmail(), subject, message);
            } else {
                 String subject = "Claim Rejected: " + item.getTitle();
                 String message = String.format(
                        "Hello %s,\n\n" +
                        "Your claim for '%s' was rejected as the proof provided was insufficient or incorrect.\n" +
                        "Warning: Users with 3 or more false claims will face a ₹100 penalty.\n\n" +
                        "Campus Hub Admin",
                        claimer.getName(), item.getTitle()
                );
                emailService.sendNotificationEmail(claimer.getEmail(), subject, message);
            }
            
            // Re-open item if no other claims are pending
            List<Claim> itemClaims = claimRepository.findByItem_ItemId(item.getItemId());
            boolean hasPending = itemClaims.stream().anyMatch(c -> c.getStatus() == ClaimStatus.PENDING);
            if (!hasPending) {
                item.setStatus(ItemStatus.OPEN);
                itemRepository.save(item);
            }
        }

        return mapToDto(updatedClaim);
    }
    
    @Override
    @Transactional
    public void waivePenalty(Long penaltyId, String adminEmail) {
        verifyAdmin(adminEmail);
        Penalty penalty = penaltyRepository.findById(penaltyId)
                .orElseThrow(() -> new ResourceNotFoundException("Penalty not found"));
                
        if (penalty.getStatus() == PenaltyStatus.UNPAID) {
            penalty.setStatus(PenaltyStatus.PAID);
            penaltyRepository.save(penalty);
            
            User user = penalty.getUser();
            user.setUnpaidFines(Math.max(0.0, user.getUnpaidFines() - penalty.getAmount()));
            userRepository.save(user);
        }
    }
    
    @Override
    @Transactional
    public void waiveAllPenaltiesForUser(Long userId, String adminEmail) {
        verifyAdmin(adminEmail);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        List<Penalty> penalties = penaltyRepository.findByUser(user);
        for (Penalty penalty : penalties) {
            if (penalty.getStatus() == PenaltyStatus.UNPAID) {
                penalty.setStatus(PenaltyStatus.PAID);
                penaltyRepository.save(penalty);
            }
        }
        
        user.setUnpaidFines(0.0);
        userRepository.save(user);
    }

    private void verifyAdmin(String email) {
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        if (admin.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Unauthorized: Admin access required.");
        }
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