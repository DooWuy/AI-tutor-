package com.vn.aitutor.repository;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.role = com.vn.aitutor.entity.enums.Role.ADMIN ORDER BY u.id")
    java.util.List<User> lockAdminAccounts();

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> lockById(@Param("id") UUID id);

    java.util.List<User> findTop50ByInvitationStatusAndIsDeletedFalseOrderByInvitationRequestedAtAsc(String status);

    long countByRoleAndActiveTrueAndIsDeletedFalse(Role role);

    @Query("SELECT u FROM User u WHERE u.isDeleted = false " +
           "AND (CAST(:role AS string) IS NULL OR u.role = :role) " +
           "AND (CAST(:active AS boolean) IS NULL OR u.active = :active) " +
           "AND (CAST(:search AS string) IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(u.username) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<User> searchAccounts(@Param("role") Role role, @Param("active") Boolean active,
                             @Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM User u WHERE (u.username = :identifier OR LOWER(u.email) = LOWER(:identifier)) AND u.isDeleted = false AND u.active = true")
    Optional<User> findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue(@Param("identifier") String identifier);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.username = :username")
    boolean existsByUsername(@Param("username") String username);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    boolean existsByEmail(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.isDeleted = false " +
           "AND (CAST(:role AS string) IS NULL OR u.role = :role) " +
           "AND (CAST(:search AS string) IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(u.username) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<User> searchUsers(@Param("role") Role role, @Param("search") String search, Pageable pageable);
}
