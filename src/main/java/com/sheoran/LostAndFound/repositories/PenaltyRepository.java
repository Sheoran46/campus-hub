package com.sheoran.LostAndFound.repositories;

import com.sheoran.LostAndFound.model.entities.Penalty;
import com.sheoran.LostAndFound.model.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PenaltyRepository extends JpaRepository<Penalty, Long> {
    List<Penalty> findByUser(User user);
    List<Penalty> findByUser_Email(String email);
    List<Penalty> findByUser_UserId(Long userId);
}