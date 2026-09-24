package com.vn.aitutor.repository;

import com.vn.aitutor.entity.QuizQuestion;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID> {

    boolean existsByTopic(String topic);
}
