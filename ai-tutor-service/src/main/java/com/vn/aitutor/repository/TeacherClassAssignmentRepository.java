package com.vn.aitutor.repository;

import com.vn.aitutor.entity.TeacherClassAssignment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TeacherClassAssignmentRepository extends JpaRepository<TeacherClassAssignment, UUID> {

    @Query("""
            SELECT a FROM TeacherClassAssignment a
            JOIN FETCH a.schoolClass
            WHERE a.teacher.id = :teacherId
            """)
    List<TeacherClassAssignment> findByTeacherIdWithClass(@Param("teacherId") UUID teacherId);

    boolean existsByTeacher_IdAndSchoolClass_Id(UUID teacherId, UUID classId);

    @Query("""
            SELECT a FROM TeacherClassAssignment a
            WHERE a.teacher.id = :teacherId
              AND a.schoolClass.id = :classId
              AND ((:subject IS NULL AND a.subject IS NULL) OR a.subject = :subject)
            """)
    Optional<TeacherClassAssignment> findByTeacherClassAndSubject(
            @Param("teacherId") UUID teacherId,
            @Param("classId") UUID classId,
            @Param("subject") String subject);

    @Modifying
    @Query("UPDATE TeacherClassAssignment a SET a.homeroom = false WHERE a.schoolClass.id = :classId")
    void clearHomeroomForClass(@Param("classId") UUID classId);

    @Query("""
            SELECT a FROM TeacherClassAssignment a
            WHERE a.teacher.id = :teacherId AND a.schoolClass.id = :classId
            """)
    List<TeacherClassAssignment> findByTeacherAndClass(
            @Param("teacherId") UUID teacherId, @Param("classId") UUID classId);
}
