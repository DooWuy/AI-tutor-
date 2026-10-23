package com.vn.aitutor.service.system.notification;

/** SQL uses notification alias n. Shared by reconciliation and the final pre-send check. */
final class ReminderEligibility {
    private ReminderEligibility() {}
    static final String VALID_SOURCE = """
            EXISTS (
                SELECT 1 FROM schedule_slots slot
                JOIN schedules schedule ON schedule.id = slot.schedule_id
                JOIN students student ON student.id = schedule.student_id
                WHERE n.source_type = 'SCHEDULE_SLOT' AND slot.id = n.source_id
                  AND student.user_id = n.user_id AND schedule.is_active = TRUE
                  AND NOT (student.study_preferences @> '{"studyReminderEnabled":false}'::jsonb)
                  AND slot.day_of_week = EXTRACT(ISODOW FROM n.occurrence_at AT TIME ZONE 'Asia/Ho_Chi_Minh') + 1
                  AND n.occurrence_at = (
                      (n.occurrence_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + slot.start_time
                  ) AT TIME ZONE 'Asia/Ho_Chi_Minh'
            )
            """;
}
