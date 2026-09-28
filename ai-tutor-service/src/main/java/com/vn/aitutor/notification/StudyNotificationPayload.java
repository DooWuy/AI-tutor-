package com.vn.aitutor.notification;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyNotificationPayload {

    private String subjectName;
    private String subjectCode;
    private String startTime;
    private String endTime;
    private String room;
    private String teacherName;

    @Builder.Default
    private List<String> weakTopics = new ArrayList<>();

    @Builder.Default
    private List<String> outline = new ArrayList<>();
}
