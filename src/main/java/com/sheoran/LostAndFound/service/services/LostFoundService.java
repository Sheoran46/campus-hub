package com.sheoran.LostAndFound.service.services;

import com.sheoran.LostAndFound.model.dto.ItemRequestDto;
import com.sheoran.LostAndFound.model.dto.ItemResponseDto;
import com.sheoran.LostAndFound.model.ItemStatus;
import com.sheoran.LostAndFound.model.ItemType;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface LostFoundService {
    ItemResponseDto reportItem(ItemRequestDto request, List<MultipartFile> images, String userEmail);
    ItemResponseDto reportItem(ItemRequestDto request, String userEmail);
    Page<ItemResponseDto> getItems(ItemType type, ItemStatus status, int page, int size);
    ItemResponseDto getItemById(Long itemId);
    Page<ItemResponseDto> searchItems(String keyword, int page, int size);
    ItemResponseDto updateItemStatus(Long itemId, ItemStatus newStatus);
    void deleteItem(Long itemId, String userEmail);
}