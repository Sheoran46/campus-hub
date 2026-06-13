package com.sheoran.LostAndFound.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sheoran.LostAndFound.model.ItemStatus;
import com.sheoran.LostAndFound.model.ItemType;
import com.sheoran.LostAndFound.model.dto.ItemRequestDto;
import com.sheoran.LostAndFound.model.dto.ItemResponseDto;
import com.sheoran.LostAndFound.service.services.LostFoundService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/items")
public class LostFoundController {

    @Autowired
    private LostFoundService lostFoundService;

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping
    public ResponseEntity<?> createItem(
            @RequestParam("itemData") String itemDataJson,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            ItemRequestDto itemRequestDto = objectMapper.readValue(itemDataJson, ItemRequestDto.class);
            lostFoundService.reportItem(itemRequestDto, images, userDetails.getUsername());
            return ResponseEntity.ok("Item reported successfully.");
            
        } catch (JsonProcessingException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid JSON format for itemData: " + e.getMessage());
        } catch (Exception e) {
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<Page<ItemResponseDto>> getItems(
            @RequestParam(required = false) ItemType type,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<ItemResponseDto> items = lostFoundService.getItems(type, status, page, size);
        return ResponseEntity.ok(items);
    }
    
    @GetMapping("/{itemId}")
    public ResponseEntity<ItemResponseDto> getItemById(@PathVariable Long itemId) {
        ItemResponseDto item = lostFoundService.getItemById(itemId);
        return ResponseEntity.ok(item);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ItemResponseDto>> searchItems(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<ItemResponseDto> items = lostFoundService.searchItems(keyword, page, size);
        return ResponseEntity.ok(items);
    }
    
    @DeleteMapping("/{itemId}")
    public ResponseEntity<?> deleteItem(@PathVariable Long itemId, Authentication authentication) {
        try {
            lostFoundService.deleteItem(itemId, authentication.getName());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}