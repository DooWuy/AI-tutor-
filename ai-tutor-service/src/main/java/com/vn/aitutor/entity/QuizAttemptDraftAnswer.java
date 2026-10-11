package com.vn.aitutor.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "quiz_attempt_draft_answers")
@Getter
@Setter
public class QuizAttemptDraftAnswer {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "draft_id") private QuizAttemptDraft draft;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_id") private QuizQuestion question;
    @Column(length = 200) private String answerValue;
    private Instant updatedAt;
}
