package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.enums.QuizStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {

    Optional<Quiz> findFirstByTitle(String title);

    @Query("""
            select q from Quiz q
            join fetch q.createdBy
            left join fetch q.lesson
            where (:ownerId is null or q.createdBy.id = :ownerId)
              and (:subject is null or q.subject = :subject)
              and (:gradeLevel is null or q.gradeLevel = :gradeLevel)
              and (:status is null or q.status = :status)
            order by q.createdAt desc
            """)
    List<Quiz> search(
            @Param("ownerId") UUID ownerId,
            @Param("subject") String subject,
            @Param("gradeLevel") String gradeLevel,
            @Param("status") QuizStatus status);
}
