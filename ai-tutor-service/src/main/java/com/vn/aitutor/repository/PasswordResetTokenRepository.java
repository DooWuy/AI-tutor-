package com.vn.aitutor.repository;

import com.vn.aitutor.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    @org.springframework.data.jpa.repository.Query("SELECT t.user.id FROM PasswordResetToken t WHERE t.token = :token")
    Optional<UUID> findUserIdByToken(@org.springframework.data.repository.query.Param("token") String token);
    java.util.List<PasswordResetToken> findByUser_IdAndIsUsedFalse(UUID id);
    Optional<PasswordResetToken> findByToken(String token);
}
