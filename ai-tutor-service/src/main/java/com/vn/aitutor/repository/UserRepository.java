package com.vn.aitutor.repository;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    @Query("SELECT u FROM User u WHERE (u.username = :identifier OR u.email = :identifier) AND u.isDeleted = false AND u.active = true")
    Optional<User> findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue(@Param("identifier") String identifier);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.username = :username")
    boolean existsByUsername(@Param("username") String username);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.email = :email")
    boolean existsByEmail(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.isDeleted = false " +
           "AND (:role IS NULL OR u.role = :role) " +
           "AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchUsers(@Param("role") Role role, @Param("search") String search, Pageable pageable);
}
