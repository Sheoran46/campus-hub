package com.sheoran.LostAndFound.controller;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sheoran.LostAndFound.model.dto.BuyRequestDto;
import com.sheoran.LostAndFound.model.dto.MarketplaceRequestDto;
import com.sheoran.LostAndFound.model.dto.MarketplaceResponseDto;
import com.sheoran.LostAndFound.service.services.MarketplaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
public class MarketplaceController {

    private final MarketplaceService marketplaceService;
    private final ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> postItem(
            @RequestParam("itemData") String itemDataJson,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            Authentication authentication
    ) {
        try {
            MarketplaceRequestDto requestDto = objectMapper.readValue(itemDataJson, MarketplaceRequestDto.class);
            String userEmail = authentication.getName();
            MarketplaceResponseDto response = marketplaceService.postItemForSale(requestDto, images, userEmail);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (JsonProcessingException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid JSON format for itemData: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<Page<MarketplaceResponseDto>> getAvailableItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<MarketplaceResponseDto> items = marketplaceService.getAvailableItems(page, size);
        return ResponseEntity.ok(items);
    }
    
    @GetMapping("/search")
    public ResponseEntity<Page<MarketplaceResponseDto>> searchItems(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<MarketplaceResponseDto> items = marketplaceService.searchItems(keyword, page, size);
        return ResponseEntity.ok(items);
    }

    @PatchMapping("/{marketId}/sold")
    public ResponseEntity<MarketplaceResponseDto> markAsSold(@PathVariable Long marketId) {
        MarketplaceResponseDto response = marketplaceService.markItemAsSold(marketId);
        return ResponseEntity.ok(response);
    }
    
    @PatchMapping("/{marketId}/quantity")
    public ResponseEntity<?> updateQuantity(
            @PathVariable Long marketId, 
            @RequestBody Map<String, Integer> payload,
            Authentication authentication) {
        try {
            Integer newQuantity = payload.get("quantity");
            if (newQuantity == null) {
                return ResponseEntity.badRequest().body("Quantity is required");
            }
            MarketplaceResponseDto response = marketplaceService.updateQuantity(marketId, newQuantity, authentication.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
    
    @DeleteMapping("/{marketId}")
    public ResponseEntity<?> deleteItem(@PathVariable Long marketId, Authentication authentication) {
        try {
            marketplaceService.deleteItem(marketId, authentication.getName());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
    
    @PostMapping("/{marketId}/buy")
    public ResponseEntity<?> sendBuyRequest(
            @PathVariable Long marketId,
            @Valid @RequestBody BuyRequestDto buyRequest,
            Authentication authentication) {
        try {
            marketplaceService.sendBuyRequest(marketId, buyRequest, authentication.getName());
            return ResponseEntity.ok(Map.of("message", "Your interest has been sent to the seller!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}