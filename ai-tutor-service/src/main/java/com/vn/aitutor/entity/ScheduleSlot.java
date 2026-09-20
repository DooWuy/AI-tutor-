package com.vn.aitutor.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "schedule_slots")
public class ScheduleSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @Column(name = "subject_name", nullable = false, length = 255)
    private String subjectName;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek; // 2 -> 8 (Monday to Sunday)

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "teacher_name", length = 255)
    private String teacherName;

    @Column(name = "room", length = 100)
    private String room;

    @Column(name = "schedule_type", length = 64)
    private String scheduleType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
