package com.vn.aitutor.repository;

import com.vn.aitutor.entity.StudyClassEnrollment;
import com.vn.aitutor.entity.enums.EnrollmentStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyClassEnrollmentRepository extends JpaRepository<StudyClassEnrollment, UUID> {

    long countByStudyClass_IdAndStatus(UUID classId, EnrollmentStatus status);

    Optional<StudyClassEnrollment> findByIdAndStudyClass_Id(UUID id, UUID classId);

    Optional<StudyClassEnrollment> findByStudyClass_IdAndStudent_Id(UUID classId, UUID studentId);

    List<StudyClassEnrollment> findByStudyClass_IdAndStatusOrderByRequestedAtAsc(UUID classId, EnrollmentStatus status);
}
