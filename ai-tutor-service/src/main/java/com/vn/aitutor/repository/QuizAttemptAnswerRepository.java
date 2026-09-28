package com.vn.aitutor.repository;

import com.vn.aitutor.entity.QuizAttemptAnswer;
import com.vn.aitutor.repository.projection.TopicAnswerCountRow;
import com.vn.aitutor.repository.projection.TopicWrongCountRow;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizAttemptAnswerRepository extends JpaRepository<QuizAttemptAnswer, UUID> {

    @Query(
            value = """
                    SELECT q.topic AS topic,
                           qz.subject AS subject,
                           qa.student_id AS studentId,
                           ans.is_correct AS correct,
                           COUNT(*) AS answerCount
                    FROM quiz_attempt_answers ans
                    JOIN quiz_attempts qa ON qa.id = ans.attempt_id
                    JOIN quiz_questions q ON q.id = ans.question_id
                    JOIN quizzes qz ON qz.id = qa.quiz_id
                    JOIN students s ON s.id = qa.student_id
                    JOIN users u ON u.id = s.user_id
                    WHERE s.class_id = :classId
                      AND u.is_deleted = FALSE
                      AND u.is_active = TRUE
                      AND qa.submitted_at >= :fromTs
                      AND qa.submitted_at <= :toTs
                      AND q.topic IS NOT NULL
                      AND btrim(q.topic) <> ''
                      AND (:subject IS NULL OR qz.subject = :subject)
                    GROUP BY q.topic, qz.subject, qa.student_id, ans.is_correct
                    """,
            nativeQuery = true)
    List<TopicAnswerCountRow> aggregateTopicAnswers(
            @Param("classId") UUID classId,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs,
            @Param("subject") String subject);

    @Query(
            value = """
                    SELECT q.topic AS topic,
                           SUM(CASE WHEN ans.is_correct THEN 0 ELSE 1 END) AS "wrongCount",
                           SUM(CASE WHEN ans.is_correct THEN 1 ELSE 0 END) AS "correctCount"
                    FROM quiz_attempt_answers ans
                    JOIN quiz_attempts qa ON qa.id = ans.attempt_id
                    JOIN quiz_questions q ON q.id = ans.question_id
                    JOIN quizzes qz ON qz.id = qa.quiz_id
                    WHERE qa.student_id = :studentId
                      AND qa.submitted_at >= :fromTs
                      AND qa.submitted_at <= :toTs
                      AND qz.subject = :subject
                      AND q.topic IS NOT NULL
                      AND btrim(q.topic) <> ''
                    GROUP BY q.topic
                    HAVING SUM(CASE WHEN ans.is_correct THEN 0 ELSE 1 END)
                         > SUM(CASE WHEN ans.is_correct THEN 1 ELSE 0 END)
                    ORDER BY (SUM(CASE WHEN ans.is_correct THEN 0 ELSE 1 END)
                            - SUM(CASE WHEN ans.is_correct THEN 1 ELSE 0 END)) DESC,
                             q.topic ASC
                    LIMIT 2
                    """,
            nativeQuery = true)
    List<TopicWrongCountRow> findWeakTopics(
            @Param("studentId") UUID studentId,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs,
            @Param("subject") String subject);
}
