package com.vn.aitutor.service.impl;

import com.vn.aitutor.dto.request.ScanReminderRequest;
import com.vn.aitutor.dto.response.NextReminderResponse;
import com.vn.aitutor.dto.response.NotificationListResponse;
import com.vn.aitutor.dto.response.ReminderPreferenceResponse;
import com.vn.aitutor.dto.response.StudyNotificationResponse;
import com.vn.aitutor.entity.Schedule;
import com.vn.aitutor.entity.ScheduleSlot;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.StudyNotification;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.notification.NotificationClock;
import com.vn.aitutor.notification.ReminderCopy;
import com.vn.aitutor.notification.ReminderWindow;
import com.vn.aitutor.notification.StoredDayOfWeek;
import com.vn.aitutor.notification.StudyNotificationPayload;
import com.vn.aitutor.notification.SubjectNames;
import com.vn.aitutor.repository.QuizAttemptAnswerRepository;
import com.vn.aitutor.repository.ScheduleRepository;
import com.vn.aitutor.repository.ScheduleSlotRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.StudyNotificationRepository;
import com.vn.aitutor.repository.projection.TopicWrongCountRow;
import jakarta.persistence.EntityManager;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Service
public class StudyNotificationService {

    static final String PREFERENCE_KEY = "preClassReminderEnabled";
    private static final DateTimeFormatter CLOCK = DateTimeFormatter.ofPattern("HH:mm");
    private static final String USER_QUEUE = "/queue/notifications";

    private final StudyNotificationRepository notificationRepository;
    private final ScheduleSlotRepository scheduleSlotRepository;
    private final ScheduleRepository scheduleRepository;
    private final StudentRepository studentRepository;
    private final QuizAttemptAnswerRepository quizAttemptAnswerRepository;
    private final EntityManager entityManager;
    private final SimpMessagingTemplate messagingTemplate;
    private final TransactionTemplate transactionTemplate;
    private final int leadMinutes;
    private final boolean manualScan;

    public StudyNotificationService(
            StudyNotificationRepository notificationRepository,
            ScheduleSlotRepository scheduleSlotRepository,
            ScheduleRepository scheduleRepository,
            StudentRepository studentRepository,
            QuizAttemptAnswerRepository quizAttemptAnswerRepository,
            EntityManager entityManager,
            SimpMessagingTemplate messagingTemplate,
            PlatformTransactionManager transactionManager,
            @Value("${app.notifications.lead-minutes:15}") int leadMinutes,
            @Value("${app.notifications.manual-scan:false}") boolean manualScan
    ) {
        this.notificationRepository = notificationRepository;
        this.scheduleSlotRepository = scheduleSlotRepository;
        this.scheduleRepository = scheduleRepository;
        this.studentRepository = studentRepository;
        this.quizAttemptAnswerRepository = quizAttemptAnswerRepository;
        this.entityManager = entityManager;
        this.messagingTemplate = messagingTemplate;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.leadMinutes = leadMinutes;
        this.manualScan = manualScan;
    }

    public int scan(LocalDateTime now, UUID onlyStudentId) {
        int created = 0;
        for (ReminderWindow.TimeRange range : ReminderWindow.dueRanges(now, leadMinutes)) {
            List<ScheduleSlot> slots = range.afterExclusive() == null
                    ? scheduleSlotRepository.findDueUntil(range.storedDayOfWeek(), range.untilInclusive())
                    : scheduleSlotRepository.findDueBetween(
                            range.storedDayOfWeek(), range.afterExclusive(), range.untilInclusive());
            for (ScheduleSlot slot : slots) {
                Student student = slot.getSchedule().getStudent();
                if (onlyStudentId != null && !onlyStudentId.equals(student.getId())) {
                    continue;
                }
                if (!remindersEnabled(student.getStudyPreferences())) {
                    continue;
                }
                if (notificationRepository.existsBySlot_IdAndLessonDate(slot.getId(), range.lessonDate())) {
                    continue;
                }
                if (insertAndPush(slot, student, range.lessonDate(), weakTopics(student.getId(), slot.getSubjectName(), now))) {
                    created++;
                }
            }
        }
        return created;
    }

    public int scanCurrentStudent(UUID userId, ScanReminderRequest request) {
        if (!manualScan) {
            throw new ResourceNotFoundException("Không tìm thấy");
        }
        Student student = requireStudent(userId);
        OffsetDateTime asOf = request == null ? null : request.getAsOf();
        LocalDateTime now = asOf == null
                ? LocalDateTime.now(NotificationClock.ZONE)
                : asOf.atZoneSameInstant(NotificationClock.ZONE).toLocalDateTime();
        return scan(now, student.getId());
    }

    @Transactional(readOnly = true)
    public NotificationListResponse list(UUID userId, int limit) {
        Student student = requireStudent(userId);
        List<StudyNotificationResponse> items = notificationRepository
                .findByStudent_IdOrderByCreatedAtDesc(student.getId(), PageRequest.of(0, limit))
                .stream()
                .map(this::toResponse)
                .toList();
        return NotificationListResponse.builder()
                .items(items)
                .unreadCount(notificationRepository.countByStudent_IdAndReadAtIsNull(student.getId()))
                .build();
    }

    @Transactional(readOnly = true)
    public StudyNotificationResponse get(UUID userId, UUID notificationId) {
        return toResponse(requireOwned(userId, notificationId));
    }

    @Transactional
    public StudyNotificationResponse markRead(UUID userId, UUID notificationId) {
        StudyNotification notification = requireOwned(userId, notificationId);
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }
        return toResponse(notification);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        Student student = requireStudent(userId);
        notificationRepository.markAllRead(student.getId(), Instant.now());
    }

    @Transactional(readOnly = true)
    public ReminderPreferenceResponse preferences(UUID userId) {
        Student student = requireStudent(userId);
        return ReminderPreferenceResponse.builder()
                .enabled(remindersEnabled(student.getStudyPreferences()))
                .nextReminder(nextReminder(student.getId(), LocalDateTime.now(NotificationClock.ZONE)).orElse(null))
                .build();
    }

    @Transactional
    public ReminderPreferenceResponse updatePreferences(UUID userId, boolean enabled) {
        Student student = requireStudent(userId);
        Map<String, Object> preferences = new HashMap<>();
        if (student.getStudyPreferences() != null) {
            preferences.putAll(student.getStudyPreferences());
        }
        preferences.put(PREFERENCE_KEY, enabled);
        student.setStudyPreferences(preferences);
        studentRepository.save(student);
        return ReminderPreferenceResponse.builder()
                .enabled(enabled)
                .nextReminder(nextReminder(student.getId(), LocalDateTime.now(NotificationClock.ZONE)).orElse(null))
                .build();
    }

    private boolean insertAndPush(
            ScheduleSlot slot,
            Student student,
            LocalDate lessonDate,
            List<String> weakTopics
    ) {
        String username = student.getUser().getUsername();
        try {
            StudyNotificationResponse response = transactionTemplate.execute(
                    status -> insert(slot, student, lessonDate, weakTopics));
            if (response == null) {
                return false;
            }
            push(username, response);
            return true;
        } catch (RuntimeException ex) {
            log.warn("Skipped pre-class reminder for slot {}: {}", slot.getId(), ex.getMessage());
            return false;
        }
    }

    private StudyNotificationResponse insert(
            ScheduleSlot slot,
            Student student,
            LocalDate lessonDate,
            List<String> weakTopics
    ) {
        UUID id = UUID.randomUUID();
        ReminderCopy.ReminderText text = ReminderCopy.compose(
                student.getUser().getFullName(),
                slot.getSubjectName(),
                slot.getStartTime(),
                slot.getRoom(),
                weakTopics,
                id,
                leadMinutes
        );
        Optional<SubjectCode> subjectCode = SubjectNames.match(slot.getSubjectName());
        StudyNotificationPayload payload = StudyNotificationPayload.builder()
                .subjectName(slot.getSubjectName())
                .subjectCode(subjectCode.map(SubjectCode::name).orElse(null))
                .startTime(CLOCK.format(slot.getStartTime()))
                .endTime(slot.getEndTime() == null ? null : CLOCK.format(slot.getEndTime()))
                .room(slot.getRoom())
                .teacherName(slot.getTeacherName())
                .weakTopics(new ArrayList<>(weakTopics))
                .outline(new ArrayList<>(text.outline()))
                .build();

        StudyNotification notification = new StudyNotification();
        notification.setId(id);
        notification.setStudent(entityManager.getReference(Student.class, student.getId()));
        notification.setUser(entityManager.getReference(User.class, student.getUser().getId()));
        notification.setSlot(entityManager.getReference(ScheduleSlot.class, slot.getId()));
        notification.setLessonDate(lessonDate);
        notification.setSubjectName(slot.getSubjectName());
        notification.setTitle(text.title());
        notification.setBody(text.body());
        notification.setDeepLink(text.deepLink());
        notification.setLessonStartsAt(ZonedDateTime.of(lessonDate, slot.getStartTime(), NotificationClock.ZONE).toInstant());
        notification.setPayload(payload);
        notification.setCreatedAt(Instant.now());
        return toResponse(notificationRepository.save(notification));
    }

    private List<String> weakTopics(UUID studentId, String subjectName, LocalDateTime now) {
        Optional<SubjectCode> subjectCode = SubjectNames.match(subjectName);
        if (subjectCode.isEmpty()) {
            return List.of();
        }
        Instant to = now.atZone(NotificationClock.ZONE).toInstant();
        Instant from = to.minus(Duration.ofDays(30));
        try {
            return quizAttemptAnswerRepository
                    .findWeakTopics(studentId, from, to, subjectCode.get().name())
                    .stream()
                    .map(TopicWrongCountRow::getTopic)
                    .filter(topic -> topic != null && !topic.isBlank())
                    .limit(2)
                    .toList();
        } catch (RuntimeException ex) {
            log.warn("Weak-topic lookup failed for student {}: {}", studentId, ex.getMessage());
            return List.of();
        }
    }

    private Optional<NextReminderResponse> nextReminder(UUID studentId, LocalDateTime now) {
        Optional<Schedule> schedule = scheduleRepository.findByStudentIdAndIsActiveTrue(studentId);
        if (schedule.isEmpty()) {
            return Optional.empty();
        }
        List<ScheduleSlot> slots = scheduleSlotRepository.findByScheduleId(schedule.get().getId());
        NextCandidate best = null;
        for (int dayOffset = 0; dayOffset < 8; dayOffset++) {
            LocalDate date = now.toLocalDate().plusDays(dayOffset);
            int storedDay = StoredDayOfWeek.from(date.getDayOfWeek());
            for (ScheduleSlot slot : slots) {
                if (slot.getDayOfWeek() == null || slot.getDayOfWeek() != storedDay || slot.getStartTime() == null) {
                    continue;
                }
                LocalDateTime start = LocalDateTime.of(date, slot.getStartTime());
                if (!start.isAfter(now)) {
                    continue;
                }
                if (best == null || start.isBefore(best.start())) {
                    best = new NextCandidate(slot, start);
                }
            }
        }
        if (best == null) {
            return Optional.empty();
        }
        ZonedDateTime lessonStart = best.start().atZone(NotificationClock.ZONE);
        return Optional.of(NextReminderResponse.builder()
                .subjectName(best.slot().getSubjectName())
                .lessonStartsAt(lessonStart.toInstant())
                .remindAt(lessonStart.minusMinutes(leadMinutes).toInstant())
                .preview(ReminderCopy.preview(best.slot().getSubjectName(), best.slot().getStartTime(), best.slot().getRoom()))
                .build());
    }

    private void push(String username, StudyNotificationResponse response) {
        try {
            messagingTemplate.convertAndSendToUser(username, USER_QUEUE, response);
        } catch (RuntimeException ex) {
            log.warn("Could not push reminder {} to {}: {}", response.getId(), username, ex.getMessage());
        }
    }

    private Student requireStudent(UUID userId) {
        return studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
    }

    private StudyNotification requireOwned(UUID userId, UUID notificationId) {
        return notificationRepository.findOwned(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));
    }

    private StudyNotificationResponse toResponse(StudyNotification notification) {
        return StudyNotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .body(notification.getBody())
                .deepLink(notification.getDeepLink())
                .subjectName(notification.getSubjectName())
                .lessonStartsAt(notification.getLessonStartsAt())
                .createdAt(notification.getCreatedAt())
                .read(notification.getReadAt() != null)
                .payload(notification.getPayload())
                .build();
    }

    static boolean remindersEnabled(Map<String, Object> preferences) {
        if (preferences == null || !preferences.containsKey(PREFERENCE_KEY)) {
            return true;
        }
        Object value = preferences.get(PREFERENCE_KEY);
        if (value instanceof Boolean enabled) {
            return enabled;
        }
        if (value instanceof String text) {
            return Boolean.parseBoolean(text);
        }
        return true;
    }

    private record NextCandidate(ScheduleSlot slot, LocalDateTime start) {
    }
}
