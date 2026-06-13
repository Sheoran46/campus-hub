package com.sheoran.LostAndFound.controller;

import com.sheoran.LostAndFound.config.JwtUtils;
import com.sheoran.LostAndFound.model.dto.LoginRequest;
import com.sheoran.LostAndFound.model.dto.RegisterRequest;
import com.sheoran.LostAndFound.model.entities.User;
import com.sheoran.LostAndFound.model.Role;
import com.sheoran.LostAndFound.repositories.UserRepository;
import com.sheoran.LostAndFound.service.services.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerUser(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already in use!"));
        }

        String token = UUID.randomUUID().toString();
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .isVerified(false)
                .verificationToken(token)
                .build();

        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), token);

        return new ResponseEntity<>(Map.of("message", "User registered successfully. Please check your email for verification link."), HttpStatus.CREATED);
    }

    @GetMapping("/verify")
    public ResponseEntity<String> verifyEmail(@RequestParam("token") String token) {
        return userRepository.findByVerificationToken(token)
                .map(user -> {
                    user.setVerified(true);
                    user.setVerificationToken(null);
                    userRepository.save(user);
                    return ResponseEntity.ok("Email verified successfully!");
                })
                .orElse(ResponseEntity.badRequest().body("Invalid verification token."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.isEnabled()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Please verify your email before logging in."));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String jwt = jwtUtils.generateTokenFromUsername(userDetails);

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("userId", user.getUserId());
        response.put("name", user.getName());
        response.put("role", user.getRole());

        return ResponseEntity.ok(response);
    }
}