package com.vn.aitutor.repository;

import com.vn.aitutor.entity.QuizAttempt;
import com.vn.aitutor.repository.projection.DaySecondsRow;
import com.vn.aitutor.repository.projection.ScoreSumCountRow;
import com.vn.aitutor.repository.projection.StudentScoreRow;
import com.vn.aitutor.repository.projection.WeeklyScoreRow;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {

    @Query(
            value = """
                    SELECT COALESCE(SUM(qa.score), 0) AS scoreSum,
                           COUNT(qa.id) AS attemptCount
                    FROM quiz_attempts qa
                    JOIN quizzes q ON q.id = qa.quiz_id
                    JOIN students s ON s.id = qa.student_id
                    JOIN users u ON u.id = s.user_id
                    WHERE s.class_id = :classId
                      AND u.is_deleted = FALSE
                      AND u.is_active = TRUE
                      AND qa.submitted_at >= :fromTs
                      AND qa.submitted_at <= :toTs
                      AND qa.score IS NOT NULL
                      AND (:subject IS NULL OR q.subject = :subject)
                    """,
            nativeQuery = true)
    ScoreSumCountRow sumScores(
            @Param("classId") UUID classId,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs,
            @Param("subject") String subject);

    @Query(
            value = """
                    SELECT (date_trunc('week', qa.submitted_at AT TIME ZONE 'Asia/Ho_Chi_Minh'))::date AS weekStart,
                           COALESCE(SUM(qa.score), 0) AS scoreSum,
                           COUNT(qa.id) AS attemptCount
                    FROM quiz_attempts qa
                    JOIN quizzes q ON q.id = qa.quiz_id
                    JOIN students s ON s.id = qa.student_id
                    JOIN users u ON u.id = s.user_id
                    WHERE s.class_id = :classId
                      AND u.is_deleted = FALSE
                      AND u.is_active = TRUE
                      AND qa.submitted_at >= :fromTs
                      AND qa.submitted_at <= :toTs
                      AND qa.score IS NOT NULL
                      AND (:subject IS NULL OR q.subject = :subject)
                    GROUP BY 1
                    ORDER BY 1
                    """,
            nativeQuery = true)
    List<WeeklyScoreRow> weeklyScores(
            @Param("classId") UUID classId,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs,
            @Param("subject") String subject);

    @Query(
            value = """
                    SELECT EXTRACT(ISODOW FROM (qa.submitted_at AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int AS dayOfWeek,
                           COALESCE(SUM(qa.duration_seconds), 0)::bigint AS totalSeconds
                    FROM quiz_attempts qa
                    JOIN quizzes q ON q.id = qa.quiz_id
                    JOIN students s ON s.id = qa.student_id
                    JOIN users u ON u.id = s.user_id
                    WHERE s.class_id = :classId
                      AND u.is_deleted = FALSE
                      AND u.is_active = TRUE
                      AND qa.submitted_at >= :fromTs
                      AND qa.submitted_at <= :toTs
                      AND qa.duration_seconds IS NOT NULL
                      AND (:subject IS NULL OR q.subject = :subject)
                    GROUP BY 1
                    """,
            nativeQuery = true)
    List<DaySecondsRow> quizSecondsByWeekday(
            @Param("classId") UUID classId,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs,
            @Param("subject") String subject);

    @Query(
            value = """
                    SELECT COALESCE(SUM(qa.duration_seconds), 0)::bigint
                    FROM quiz_attempts qa
                    JOIN quizzes q ON q.id = qa.quiz_id
                    JOIN students s ON s.id = qa.student_id
                    JOIN users u ON u.id = s.user_id
                    WHERE s.class_id = :classId
                      AND u.is_deleted = FALSE
                      AND u.is_active = TRUE
                      AND qa.submitted_at >= :fromTs
                      AND qa.submitted_at <= :toTs
                      AND qa.duration_seconds IS NOT NULL
                      AND (:subject IS NULL OR q.subject = :subject)
                    """,
            nativeQuery = true)
    Long sumQuizDurationSeconds(
            @Param("classId") UUID classId,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs,
            @Param("subject") String subject);

    @Query(
            value = """
                    SELECT s.id AS studentId,
                           agg.score_sum AS scoreSum,
                           COALESCE(agg.attempt_count, 0) AS attemptCount,
                           s.last_activity_date AS lastActivityDate
                    FROM students s
                    JOIN users u ON u.id = s.user_id
                    LEFT JOIN (
                        SELECT qa.student_id,
                               SUM(qa.score) AS score_sum,
                               COUNT(qa.id) AS attempt_count
                        FROM quiz_attempts qa
                        JOIN quizzes q ON q.id = qa.quiz_id
                        WHERE qa.submitted_at >= :fromTs
                          AND qa.submitted_at <= :toTs
                          AND qa.score IS NOT NULL
                          AND (:subject IS NULL OR q.subject = :subject)
                        GROUP BY qa.student_id
                    ) agg ON agg.student_id = s.id
                    WHERE s.class_id = :classId
                      AND u.is_deleted = FALSE
                      AND u.is_active = TRUE
                    """,
            nativeQuery = true)
    List<StudentScoreRow> studentScores(
            @Param("classId") UUID classId,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs,
            @Param("subject") String subject);
}
