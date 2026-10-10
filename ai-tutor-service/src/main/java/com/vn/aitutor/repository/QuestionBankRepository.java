package com.vn.aitutor.repository;

import com.vn.aitutor.entity.QuestionBank;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, UUID> {
    Page<QuestionBank> findBySkillId(UUID skillId, Pageable pageable);

    @Query(value = "SELECT * FROM question_bank WHERE stem ILIKE %:topic% AND difficulty = :difficulty ORDER BY random() LIMIT :limit", nativeQuery = true)
    List<QuestionBank> findRandomByTopicAndDifficulty(@Param("topic") String topic, @Param("difficulty") Integer difficulty, @Param("limit") int limit);
}
