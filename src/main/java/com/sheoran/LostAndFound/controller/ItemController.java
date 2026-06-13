// package com.sheoran.LostAndFound.controller;
//
// // This class is redundant and conflicts with LostFoundController which handles /api/items
// // It has been commented out to resolve compilation and mapping conflicts.
//
// import com.sheoran.LostAndFound.model.dto.ItemDTO;
// import com.sheoran.LostAndFound.model.entities.Item;
// import com.sheoran.LostAndFound.model.entities.ItemImage;
// import com.sheoran.LostAndFound.repositories.ItemRepository;
// import com.sheoran.LostAndFound.service.services.CloudinaryService;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.MediaType;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.multipart.MultipartFile;
//
// import java.io.IOException;
// import java.util.List;
// import java.util.Map;
//
// // @RestController
// // @RequestMapping("/api/items")
// public class ItemController {
//
//     // @Autowired
//     // private CloudinaryService cloudinaryService;
//
//     // @Autowired
//     // private ItemRepository itemRepository;
//
//     // @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
//     // public ResponseEntity<?> createItem(
//     //         @RequestPart("itemData") ItemDTO itemDTO,
//     //         @RequestPart("images") List<MultipartFile> images) {
//
//     //     try {
//     //         // 1. Map DTO attributes onto your core Item entity
//     //         Item item = new Item();
//     //         item.setTitle(itemDTO.getTitle());
//     //         item.setDescription(itemDTO.getDescription());
//     //         item.setLocation(itemDTO.getLocation());
//
//     //         // 2. Loop through every image payload sent by React
//     //         for (MultipartFile file : images) {
//     //             if (!file.isEmpty()) {
//     //                 // Upload to Cloudinary cloud storage
//     //                 Map<?, ?> result = cloudinaryService.uploadImage(file);
//
//     //                 // Pull out URL data returned by Cloudinary APIs
//     //                 String url = (String) result.get("secure_url");
//     //                 String publicId = (String) result.get("public_id");
//
//     //                 // Bind URL tracking details into your relational table mapping
//     //                 ItemImage itemImage = new ItemImage(null, url, publicId, item);
//     //                 item.getImages().add(itemImage);
//     //             }
//     //         }
//
//     //         // 3. Save the item and cascade save the mapped image records
//     //         itemRepository.save(item);
//     //         return ResponseEntity.ok("Item listed successfully with structural assets.");
//
//     //     } catch (IOException e) {
//     //         return ResponseEntity.internalServerError().body("Failed to upload assets to cloud infrastructure.");
//     //     }
//     // }
// }