package com.sheoran.LostAndFound.service.services;


import com.sheoran.LostAndFound.exceptions.ResourceNotFoundException;
import com.sheoran.LostAndFound.model.dto.BuyRequestDto;
import com.sheoran.LostAndFound.model.dto.MarketplaceRequestDto;
import com.sheoran.LostAndFound.model.dto.MarketplaceResponseDto;
import com.sheoran.LostAndFound.model.entities.ItemImage;
import com.sheoran.LostAndFound.model.entities.MarketplaceItem;
import com.sheoran.LostAndFound.model.entities.User;
import com.sheoran.LostAndFound.model.MarketStatus;
import com.sheoran.LostAndFound.repositories.ItemImageRepository;
import com.sheoran.LostAndFound.repositories.MarketplaceItemRepository;
import com.sheoran.LostAndFound.repositories.UserRepository;
import com.sheoran.LostAndFound.service.ai.GeminiAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarketplaceServiceImpl implements MarketplaceService {

    private final MarketplaceItemRepository marketplaceRepository;
    private final UserRepository userRepository;
    private final ItemImageRepository itemImageRepository;
    private final CloudinaryService cloudinaryService;
    private final GeminiAiService geminiAiService;
    private final PaymentService paymentService;
    private final EmailService emailService;

    @Override
    @Transactional
    public MarketplaceResponseDto postItemForSale(MarketplaceRequestDto request, List<MultipartFile> images, String userEmail) {
        
        // 1. Verify Payment First
        boolean isPaymentValid = paymentService.verifyPaymentSignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (!isPaymentValid) {
            throw new IllegalArgumentException("Payment verification failed. Cannot list item.");
        }

        // 2. If payment is valid, proceed with saving the item
        User seller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        MarketplaceItem item = MarketplaceItem.builder()
                .seller(seller)
                .title(request.getTitle())
                .description(request.getDescription())
                .askingPrice(request.getAskingPrice())
                .quantity(request.getQuantity() != null ? request.getQuantity() : 1)
                .status(MarketStatus.AVAILABLE)
                // AI fields are initially null until the background task finishes
                .build();

        MarketplaceItem savedItem = marketplaceRepository.save(item);
        List<String> savedImageUrls = new ArrayList<>();

        if (images != null && !images.isEmpty()) {
            for (MultipartFile file : images) {
                try {
                    Map<?, ?> result = cloudinaryService.uploadImage(file);
                    String url = (String) result.get("secure_url");
                    String publicId = (String) result.get("public_id");
                    ItemImage itemImage = ItemImage.builder()
                            .marketplaceItem(savedItem)
                            .imageUrl(url)
                            .publicId(publicId)
                            .item(null)
                            .build();
                    itemImageRepository.save(itemImage);
                    savedImageUrls.add(url);
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload marketplace image", e);
                }
            }
        }

        // TRIGGER THE BACKGROUND AI ANALYSIS
        geminiAiService.analyzeAndSaveItemPricing(
                savedItem.getMarketId(),
                savedItem.getTitle(),
                savedItem.getDescription(),
                savedItem.getAskingPrice()
        );

        return mapToDto(savedItem, savedImageUrls);
    }

    @Override
    public Page<MarketplaceResponseDto> getAvailableItems(int page, int size) {
        Page<MarketplaceItem> items = marketplaceRepository.findByStatus(MarketStatus.AVAILABLE, PageRequest.of(page, size));
        return items.map(item -> loadImagesAndMapToDto(item));
    }
    
    @Override
    public Page<MarketplaceResponseDto> searchItems(String keyword, int page, int size) {
        Page<MarketplaceItem> items = marketplaceRepository.searchByKeyword(keyword, PageRequest.of(page, size));
        return items.map(item -> loadImagesAndMapToDto(item));
    }

    @Override
    @Transactional
    public MarketplaceResponseDto markItemAsSold(Long marketId) {
        MarketplaceItem item = marketplaceRepository.findById(marketId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        item.setStatus(MarketStatus.SOLD);
        MarketplaceItem updatedItem = marketplaceRepository.save(item);
        return loadImagesAndMapToDto(updatedItem);
    }
    
    @Override
    @Transactional
    public MarketplaceResponseDto updateQuantity(Long marketId, Integer newQuantity, String userEmail) {
        MarketplaceItem item = marketplaceRepository.findById(marketId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
                
        if (!item.getSeller().getEmail().equals(userEmail)) {
            throw new IllegalArgumentException("You are not authorized to update this item.");
        }
        
        if (newQuantity < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative.");
        }
        
        item.setQuantity(newQuantity);
        
        // If quantity reaches 0, automatically mark as sold/unavailable
        if (newQuantity == 0) {
            item.setStatus(MarketStatus.SOLD);
        } else if (item.getStatus() == MarketStatus.SOLD) {
             item.setStatus(MarketStatus.AVAILABLE);
        }
        
        MarketplaceItem updatedItem = marketplaceRepository.save(item);
        return loadImagesAndMapToDto(updatedItem);
    }
    
    @Override
    @Transactional
    public void deleteItem(Long marketId, String userEmail) {
        MarketplaceItem item = marketplaceRepository.findById(marketId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
                
        if (!item.getSeller().getEmail().equals(userEmail)) {
            throw new IllegalArgumentException("You are not authorized to delete this item.");
        }
        
        marketplaceRepository.delete(item);
    }

    @Override
    public void sendBuyRequest(Long marketId, BuyRequestDto buyRequest, String buyerEmail) {
        MarketplaceItem item = marketplaceRepository.findById(marketId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer not found"));

        String subject = "New Purchase Request for your item: " + item.getTitle();
        String message = String.format(
                "Hello %s,\n\n" +
                "Good news! A user is interested in buying your item '%s' listed for ₹%.2f.\n\n" +
                "Buyer Details:\n" +
                "- Name: %s\n" +
                "- Email: %s\n" +
                "- Phone: %s\n" +
                "- Additional Message: %s\n\n" +
                "Please reach out to the buyer directly to arrange the sale.\n\n" +
                "Best regards,\nCampus Hub Team",
                item.getSeller().getName(),
                item.getTitle(),
                item.getAskingPrice(),
                buyer.getName(),
                buyer.getEmail(),
                buyRequest.getPhone(),
                buyRequest.getExtraDetails() != null ? buyRequest.getExtraDetails() : "None"
        );

        emailService.sendNotificationEmail(item.getSeller().getEmail(), subject, message);
    }

    private MarketplaceResponseDto loadImagesAndMapToDto(MarketplaceItem item) {
        List<String> imageUrls = itemImageRepository.findByMarketplaceItem_MarketId(item.getMarketId())
                .stream().map(ItemImage::getImageUrl).collect(Collectors.toList());
        return mapToDto(item, imageUrls);
    }

    private MarketplaceResponseDto mapToDto(MarketplaceItem item, List<String> imageUrls) {
        return MarketplaceResponseDto.builder()
                .marketId(item.getMarketId())
                .sellerName(item.getSeller().getName())
                .sellerEmail(item.getSeller().getEmail())
                .title(item.getTitle())
                .description(item.getDescription())
                .askingPrice(item.getAskingPrice())
                .quantity(item.getQuantity())
                .aiNewPriceEstimate(item.getAiNewPriceEstimate())
                .aiProfitAnalysis(item.getAiProfitAnalysis())
                .status(item.getStatus())
                .imageUrls(imageUrls)
                .build();
    }
}