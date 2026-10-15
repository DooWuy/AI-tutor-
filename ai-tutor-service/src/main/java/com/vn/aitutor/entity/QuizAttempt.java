package com.vn.aitutor.entity;

import com.vn.aitutor.entity.enums.XpAwardStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "score")
    private Double score;

    @Column(name = "xp_earned", nullable = false)
    private int xpEarned;

    @Enumerated(EnumType.STRING)
    @Column(name = "xp_award_status", nullable = false, length = 32)
    private XpAwardStatus xpAwardStatus = XpAwardStatus.LEGACY_UNKNOWN;

    @Column(name = "daily_xp_earned")
    private Integer dailyXpEarned;

    @Column(name = "daily_xp_cap")
    private Integer dailyXpCap;

    @Column(name = "source_draft_id", unique = true)
    private UUID sourceDraftId;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "is_visible", nullable = false)
    private Boolean isVisible = true;
}
