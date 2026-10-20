package com.vn.aitutor.config;

import static org.mockito.Mockito.*;

import com.vn.aitutor.service.classroom.StudyClassService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StudyClassDissolveJobTest {

    @Mock
    private StudyClassService studyClassService;

    private StudyClassDissolveJob job;

    @BeforeEach
    void setUp() {
        job = new StudyClassDissolveJob(studyClassService);
    }

    @Test
    void dissolveExpiredClasses_whenClassesExpired_callsServiceAndLogs() {
        when(studyClassService.dissolveExpired()).thenReturn(3);

        job.dissolveExpiredClasses();

        verify(studyClassService).dissolveExpired();
    }

    @Test
    void dissolveExpiredClasses_whenNoneExpired_callsServiceWithoutLogInfo() {
        when(studyClassService.dissolveExpired()).thenReturn(0);

        job.dissolveExpiredClasses();

        verify(studyClassService).dissolveExpired();
    }
}
