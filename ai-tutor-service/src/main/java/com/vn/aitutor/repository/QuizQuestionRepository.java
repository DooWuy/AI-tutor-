package com.vn.aitutor.repository;

import com.vn.aitutor.entity.QuizQuestion;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID> {

    boolean existsByTopic(String topic);

    long countByQuizId(UUID quizId);

    List<QuizQuestion> findByQuizIdOrderByOrderIndexAsc(UUID quizId);

    @Query("select coalesce(max(q.orderIndex), -1) from QuizQuestion q where q.quiz.id = :quizId")
    int maxOrderIndex(@Param("quizId") UUID quizId);

    @Query("select q.sourceQuestion.id from QuizQuestion q where q.quiz.id = :quizId and q.sourceQuestion is not null")
    List<UUID> findSourceIds(@Param("quizId") UUID quizId);

    @Query("select q.quiz.id, count(q) from QuizQuestion q where q.quiz.id in :quizIds group by q.quiz.id")
    List<Object[]> countGrouped(@Param("quizIds") Collection<UUID> quizIds);
}
