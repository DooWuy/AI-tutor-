package com.vn.aitutor.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "quiz_attempt_answers",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_quiz_attempt_answers_attempt_question",
                        columnNames = {"attempt_id", "question_id"}))
public class QuizAttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;

    @Column(name = "selected_option_key", length = 64)
    private String selectedOptionKey;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;
}
