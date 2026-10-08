package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Quiz;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {

    Optional<Quiz> findFirstByTitle(String title);

    List<Quiz> findBySubjectAndAiGeneratedAndCreatedByIdOrderByCreatedAtDesc(String subject, boolean aiGenerated, UUID createdById);

    // Simplified for now: just return all non-AI generated quizzes for the subject
    List<Quiz> findBySubjectAndAiGeneratedFalseOrderByCreatedAtDesc(String subject);
}
