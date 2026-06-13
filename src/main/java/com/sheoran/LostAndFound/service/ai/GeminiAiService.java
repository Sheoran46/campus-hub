package com.sheoran.LostAndFound.service.ai;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sheoran.LostAndFound.model.ItemStatus;
import com.sheoran.LostAndFound.model.ItemType;
import com.sheoran.LostAndFound.model.entities.Item;
import com.sheoran.LostAndFound.repositories.ItemRepository;
import com.sheoran.LostAndFound.repositories.MarketplaceItemRepository;
import com.sheoran.LostAndFound.service.services.EmailService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GeminiAiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiAiService.class);

    private final RestTemplate restTemplate;
    private final MarketplaceItemRepository marketplaceItemRepository;
    private final ItemRepository itemRepository;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.api.key}")
    private String apiKey;

    // @Async tells Spring to run this in a background thread
    @Async
    public void analyzeAndSaveItemPricing(Long marketId, String title, String description, Double askingPrice) {
        try {
            String prompt = String.format(
                    "You are an expert appraiser. I am selling a '%s'. Description: '%s'. My asking price is ₹%.2f. " +
                            "Respond strictly with a JSON object containing two keys: " +
                            "1. 'estimatedNewPrice' (a realistic number in INR for buying this brand new), " +
                            "2. 'analysis' (a short 2-sentence summary of whether ₹%.2f is a good deal).",
                    title, description, askingPrice, askingPrice
            );

            String aiText = callGeminiApi(prompt);
            JsonNode aiJson = objectMapper.readTree(aiText);

            // Update the database
            marketplaceItemRepository.findById(marketId).ifPresent(item -> {
                item.setAiNewPriceEstimate(aiJson.get("estimatedNewPrice").asDouble());
                item.setAiProfitAnalysis(aiJson.get("analysis").asText());
                marketplaceItemRepository.save(item);
                logger.info("Successfully added AI analysis to item ID: " + marketId);
            });

        } catch (Exception e) {
            logger.error("Failed to fetch AI analysis for item ID: " + marketId, e);
        }
    }

    @Async
    public void autoMatchLostAndFound(Item newItem) {
        try {
            ItemType targetType = newItem.getType() == ItemType.LOST ? ItemType.FOUND : ItemType.LOST;
            List<Item> potentialMatches = itemRepository.findByTypeAndStatusOrderByDateReportedDesc(targetType, ItemStatus.OPEN);

            if (potentialMatches.isEmpty()) {
                return;
            }

            // Create a prompt summarizing the new item and the potential matches
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append(String.format("I just %s an item: '%s' - '%s' at '%s'. ", 
                    newItem.getType().name().toLowerCase(), newItem.getTitle(), newItem.getDescription(), newItem.getLocation()));
            promptBuilder.append("Compare it against the following list of items and tell me if there is a highly probable match. ");
            promptBuilder.append("Respond strictly with a JSON array of matching 'itemId's (e.g., [1, 5]). Return an empty array [] if no good match exists.\n");

            for (Item match : potentialMatches) {
                promptBuilder.append(String.format("ID: %d | Title: '%s' | Desc: '%s' | Loc: '%s'\n",
                        match.getItemId(), match.getTitle(), match.getDescription(), match.getLocation()));
            }

            String aiText = callGeminiApi(promptBuilder.toString());
            JsonNode matchArray = objectMapper.readTree(aiText);

            if (matchArray.isArray() && matchArray.size() > 0) {
                logger.info("AI found potential matches for Item {}: {}", newItem.getItemId(), aiText);
                
                // Alert the users involved in the matches
                for (JsonNode idNode : matchArray) {
                    Long matchedItemId = idNode.asLong();
                    itemRepository.findById(matchedItemId).ifPresent(matchedItem -> {
                        // Alert the person who just posted
                        String messageForNew = String.format("Good news! We found a potential match for your %s item '%s'. Check out item ID %d posted by %s.",
                                newItem.getType().name().toLowerCase(), newItem.getTitle(), matchedItem.getItemId(), matchedItem.getReporter().getEmail());
                        emailService.sendNotificationEmail(newItem.getReporter().getEmail(), "Potential Match Found!", messageForNew);

                        // Alert the person who posted the older matching item
                        String messageForOld = String.format("Good news! Someone just posted a %s item '%s' that might match yours. Check out item ID %d posted by %s.",
                                newItem.getType().name().toLowerCase(), newItem.getTitle(), newItem.getItemId(), newItem.getReporter().getEmail());
                        emailService.sendNotificationEmail(matchedItem.getReporter().getEmail(), "Potential Match Found!", messageForOld);
                    });
                }
            }

        } catch (Exception e) {
            logger.error("Failed during AI auto-matching for item ID: " + newItem.getItemId(), e);
        }
    }

    private String callGeminiApi(String prompt) throws Exception {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        String fullUrl = apiUrl + "?key=" + apiKey;
        String responseStr = restTemplate.postForObject(fullUrl, requestEntity, String.class);

        JsonNode rootNode = objectMapper.readTree(responseStr);
        String aiText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

        // Clean up Markdown formatting Gemini sometimes adds (e.g., ```json ... ```)
        return aiText.replace("```json", "").replace("```", "").trim();
    }
}