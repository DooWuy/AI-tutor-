package com.vn.aitutor.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "quiz_attempt_drafts")
@Getter
@Setter
public class QuizAttemptDraft {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "quiz_id") private Quiz quiz;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "student_id") private Student student;
    private Instant startedAt;
    private Instant expiresAt;
    private Instant updatedAt;
    private Instant completedAt;
}
