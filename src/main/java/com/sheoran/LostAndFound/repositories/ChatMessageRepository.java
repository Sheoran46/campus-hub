package com.sheoran.LostAndFound.repositories;

import com.sheoran.LostAndFound.model.entities.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Fetch the global conversation history
    @Query("SELECT m FROM ChatMessage m ORDER BY m.timestamp DESC")
    Page<ChatMessage> findGlobalChatHistory(Pageable pageable);
}