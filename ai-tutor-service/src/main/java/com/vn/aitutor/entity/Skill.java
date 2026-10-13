package com.vn.aitutor.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "skills")
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "subject", length = 100)
    private String subject;

    @Column(name = "grade_level", length = 50)
    private String gradeLevel;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "importance", nullable = false)
    @Builder.Default
    private Integer importance = 1;

    @Column(name = "mastery_threshold", nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal masteryThreshold = new BigDecimal("0.90");

    @Column(name = "min_attempts", nullable = false)
    @Builder.Default
    private Integer minAttempts = 3;

    @Column(name = "can_skip", nullable = false)
    @Builder.Default
    private Boolean canSkip = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
