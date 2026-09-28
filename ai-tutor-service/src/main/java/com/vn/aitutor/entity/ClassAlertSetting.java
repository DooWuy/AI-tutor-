package com.vn.aitutor.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "class_alert_settings")
public class ClassAlertSetting {

    @Id
    @Column(name = "class_id", nullable = false, updatable = false)
    private UUID classId;

    @Column(name = "score_threshold", nullable = false, precision = 4, scale = 1)
    private BigDecimal scoreThreshold;

    @Column(name = "inactivity_days", nullable = false)
    private int inactivityDays;

    @Column(name = "max_gap_topics", nullable = false)
    private int maxGapTopics;

    @Column(name = "message_template", nullable = false, length = 2000)
    private String messageTemplate;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;
}
