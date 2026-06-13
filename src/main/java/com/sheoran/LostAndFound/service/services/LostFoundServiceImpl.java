package com.sheoran.LostAndFound.service.services;


import com.sheoran.LostAndFound.exceptions.ResourceNotFoundException;
import com.sheoran.LostAndFound.model.dto.ItemRequestDto;
import com.sheoran.LostAndFound.model.dto.ItemResponseDto;
import com.sheoran.LostAndFound.model.entities.Item;
import com.sheoran.LostAndFound.model.entities.ItemImage;
import com.sheoran.LostAndFound.model.entities.User;
import com.sheoran.LostAndFound.model.ItemStatus;
import com.sheoran.LostAndFound.model.ItemType;
import com.sheoran.LostAndFound.repositories.ItemImageRepository;
import com.sheoran.LostAndFound.repositories.ItemRepository;
import com.sheoran.LostAndFound.repositories.UserRepository;
import com.sheoran.LostAndFound.service.ai.GeminiAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
public class LostFoundServiceImpl implements LostFoundService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ItemImageRepository itemImageRepository;
    private final CloudinaryService cloudinaryService;
    private final GeminiAiService geminiAiService;

    @Override
    @Transactional
    public ItemResponseDto reportItem(ItemRequestDto request, List<MultipartFile> images, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Item item = Item.builder()
                .reporter(user)
                .type(request.getType())
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .status(ItemStatus.OPEN)
                .build();

        Item savedItem = itemRepository.save(item);

        List<String> savedImageUrls = new ArrayList<>();

        if (images != null && !images.isEmpty()) {
            for (MultipartFile file : images) {
                try {
                    Map<?, ?> result = cloudinaryService.uploadImage(file);
                    String url = (String) result.get("secure_url");
                    String publicId = (String) result.get("public_id");

                    ItemImage itemImage = ItemImage.builder()
                            .item(savedItem)
                            .imageUrl(url)
                            .publicId(publicId)
                            .marketplaceItem(null)
                            .build();
                    itemImageRepository.save(itemImage);

                    savedImageUrls.add(url);
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload image to cloud storage", e);
                }
            }
        }

        // Trigger AI Auto-Matching
        geminiAiService.autoMatchLostAndFound(savedItem);

        return mapToResponseDto(savedItem, savedImageUrls);
    }


    @Override
    public ItemResponseDto reportItem(ItemRequestDto request, String userEmail) {
        return null;
    }

    @Override
    public Page<ItemResponseDto> getItems(ItemType type, ItemStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateReported").descending());
        Page<Item> items = itemRepository.findByTypeAndStatus(type, status, pageable);

        return items.map(item -> loadImagesAndMapToDto(item));
    }
    
    @Override
    public ItemResponseDto getItemById(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));
        return loadImagesAndMapToDto(item);
    }

    @Override
    public Page<ItemResponseDto> searchItems(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateReported").descending());
        Page<Item> items = itemRepository.searchItemsByKeyword(keyword, pageable);

        return items.map(item -> loadImagesAndMapToDto(item));
    }

    @Override
    @Transactional
    public ItemResponseDto updateItemStatus(Long itemId, ItemStatus newStatus) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));

        item.setStatus(newStatus);
        Item updatedItem = itemRepository.save(item);

        return loadImagesAndMapToDto(updatedItem);
    }
    
    @Override
    @Transactional
    public void deleteItem(Long itemId, String userEmail) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
                
        if (!item.getReporter().getEmail().equals(userEmail)) {
            throw new IllegalArgumentException("You are not authorized to delete this item.");
        }
        
        itemRepository.delete(item);
    }

    private ItemResponseDto loadImagesAndMapToDto(Item item) {
        List<String> imageUrls = itemImageRepository.findByItem_ItemId(item.getItemId())
                .stream()
                .map(ItemImage::getImageUrl)
                .collect(Collectors.toList());
        return mapToResponseDto(item, imageUrls);
    }

    private ItemResponseDto mapToResponseDto(Item item, List<String> imageUrls) {
        return ItemResponseDto.builder()
                .itemId(item.getItemId())
                .reporterName(item.getReporter().getName())
                .reporterEmail(item.getReporter().getEmail()) // Added reporter email
                .type(item.getType())
                .title(item.getTitle())
                .description(item.getDescription())
                .location(item.getLocation())
                .dateReported(item.getDateReported())
                .status(item.getStatus())
                .imageUrls(imageUrls)
                .build();
    }
}