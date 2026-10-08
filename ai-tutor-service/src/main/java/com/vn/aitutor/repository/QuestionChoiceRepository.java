package com.vn.aitutor.repository;

import com.vn.aitutor.entity.QuestionChoice;
import java.util.Collection;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestionChoiceRepository extends JpaRepository<QuestionChoice, UUID> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from QuestionChoice choice where choice.question.id in :questionIds")
    int deleteByQuestionIdIn(@Param("questionIds") Collection<UUID> questionIds);
}
