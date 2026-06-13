package com.sheoran.LostAndFound.controller;

import com.razorpay.RazorpayException;
import com.sheoran.LostAndFound.service.services.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @GetMapping("/key")
    public ResponseEntity<Map<String, String>> getRazorpayKey() {
        return ResponseEntity.ok(Map.of("keyId", razorpayKeyId));
    }

    @PostMapping("/create-order")
    public ResponseEntity<String> createOrder(Authentication authentication) {
        try {
            String orderJson = paymentService.createOrder(authentication.getName());
            return ResponseEntity.ok(orderJson);
        } catch (RazorpayException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create Razorpay order: " + e.getMessage());
        }
    }
}