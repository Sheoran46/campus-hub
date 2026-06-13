package com.sheoran.LostAndFound.service.services;


import com.sheoran.LostAndFound.model.dto.BuyRequestDto;
import com.sheoran.LostAndFound.model.dto.MarketplaceRequestDto;
import com.sheoran.LostAndFound.model.dto.MarketplaceResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface MarketplaceService {
    MarketplaceResponseDto postItemForSale(MarketplaceRequestDto request, List<MultipartFile> images, String userEmail);
    Page<MarketplaceResponseDto> getAvailableItems(int page, int size);
    Page<MarketplaceResponseDto> searchItems(String keyword, int page, int size);
    MarketplaceResponseDto markItemAsSold(Long marketId);
    MarketplaceResponseDto updateQuantity(Long marketId, Integer newQuantity, String userEmail);
    void deleteItem(Long marketId, String userEmail);
    void sendBuyRequest(Long marketId, BuyRequestDto buyRequest, String buyerEmail);
}