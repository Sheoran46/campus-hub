package com.sheoran.LostAndFound.controller;


import com.sheoran.LostAndFound.exceptions.ResourceNotFoundException;
import com.sheoran.LostAndFound.model.entities.Penalty;
import com.sheoran.LostAndFound.model.entities.User;
import com.sheoran.LostAndFound.model.PenaltyStatus;
import com.sheoran.LostAndFound.repositories.PenaltyRepository;
import com.sheoran.LostAndFound.repositories.UserRepository;



import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

        import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PenaltyRepository penaltyRepository;

    // 1. Let the student view their own profile and unpaid fines
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMyProfile(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Penalty> userPenalties = penaltyRepository.findByUser_UserId(user.getUserId());

        Map<String, Object> profile = new HashMap<>();
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole());
        profile.put("totalUnpaidFinesRs", user.getUnpaidFines());
        profile.put("penaltyHistory", userPenalties); // Send their history of fines

        return ResponseEntity.ok(profile);
    }

    // 2. Simulate paying a fine (In a real app, you would integrate Razorpay/Stripe here)
    @PatchMapping("/penalties/{penaltyId}/pay")
    @Transactional
    public ResponseEntity<Map<String, String>> payFine(@PathVariable Long penaltyId, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Penalty penalty = penaltyRepository.findById(penaltyId)
                .orElseThrow(() -> new ResourceNotFoundException("Penalty not found"));

        // Ensure the student can only pay their OWN fines
        if (!penalty.getUser().getUserId().equals(user.getUserId())) {
            throw new IllegalStateException("You cannot pay someone else's fine.");
        }

        if (penalty.getStatus() == PenaltyStatus.PAID) {
            return ResponseEntity.badRequest().body(Map.of("message", "This fine is already paid."));
        }

        // Mark penalty as paid and reduce user's ledger
        penalty.setStatus(PenaltyStatus.PAID);
        penaltyRepository.save(penalty);

        user.setUnpaidFines(user.getUnpaidFines() - penalty.getAmount());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Fine of Rs " + penalty.getAmount() + " paid successfully."));
    }
}