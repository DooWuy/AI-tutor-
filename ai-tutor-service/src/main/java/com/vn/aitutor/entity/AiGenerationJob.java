package com.vn.aitutor.entity;

import com.vn.aitutor.entity.enums.GenerationJobKind;
import com.vn.aitutor.entity.enums.GenerationJobStatus;
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
import org.hibernate.annotations.CreationTimestamp;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "ai_generation_jobs")
public class AiGenerationJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false, length = 16)
    private GenerationJobKind kind;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private GenerationJobStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    @Column(name = "batch_id")
    private UUID batchId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;

    @Column(name = "difficulty")
    private Integer difficulty;

    @Column(name = "question_count")
    private Integer questionCount;

    @Column(name = "question_type", length = 32)
    private String questionType;

    @Column(name = "topic", length = 200)
    private String topic;

    @Column(name = "min_difficulty")
    private Integer minDifficulty;

    @Column(name = "max_difficulty")
    private Integer maxDifficulty;

    @Column(name = "multiple_choice")
    private Integer multipleChoice;

    @Column(name = "true_false")
    private Integer trueFalse;

    @Column(name = "fill_blank")
    private Integer fillBlank;

    @Column(name = "message")
    private String message;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "finished_at")
    private Instant finishedAt;
}
