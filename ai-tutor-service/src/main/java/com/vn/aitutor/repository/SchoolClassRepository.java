package com.vn.aitutor.repository;

import com.vn.aitutor.entity.SchoolClass;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SchoolClassRepository extends JpaRepository<SchoolClass, UUID> {

    @Query("""
            SELECT c FROM SchoolClass c
            WHERE COALESCE(c.schoolName, '') = COALESCE(:schoolName, '')
              AND c.academicYear = :academicYear
              AND c.name = :name
            """)
    Optional<SchoolClass> findBySchoolYearAndName(
            @Param("schoolName") String schoolName,
            @Param("academicYear") String academicYear,
            @Param("name") String name);

    @Query("SELECT c FROM SchoolClass c ORDER BY c.gradeLevel, c.name")
    List<SchoolClass> findAllOrdered();

    Optional<SchoolClass> findFirstByNameOrderByCreatedAtDesc(String name);
}
