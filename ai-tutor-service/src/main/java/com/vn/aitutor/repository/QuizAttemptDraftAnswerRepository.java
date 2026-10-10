package com.vn.aitutor.repository;

import com.vn.aitutor.entity.QuizAttemptDraftAnswer;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizAttemptDraftAnswerRepository extends JpaRepository<QuizAttemptDraftAnswer, UUID> {
    List<QuizAttemptDraftAnswer> findByDraftId(UUID draftId);
}
