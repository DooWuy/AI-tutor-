package com.vn.aitutor.service.quiz;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.mq.producer.QuizGenerationProducer;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StudentQuizServiceTest {

    @Mock private QuizRepository quizRepository;
    @Mock private QuizQuestionRepository quizQuestionRepository;
    @Mock private UserRepository userRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private QuizGenerationProducer quizGenerationProducer;
    @Mock private QuizAttemptRepository quizAttemptRepository;
    @Mock private QuizAccessService access;
    @InjectMocks private StudentQuizService service;

    @Test
    void studentWithoutAClassSeesNoOfficialQuiz() {
        when(access.currentStudent()).thenReturn(new Student());

        assertTrue(service.getAssignedQuizzes("TOAN").isEmpty());
        verify(quizRepository, never()).findOfficialForClass(any(), any());
    }

    @Test
    void studentSeesOnlyTheQuizReturnedForTheirClass() {
        UUID classId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(classId);
        schoolClass.setGradeLevel("12");
        Student student = new Student();
        student.setId(studentId);
        student.setGradeLevel("11");
        student.setClassEntity(schoolClass);
        Quiz quiz = new Quiz();
        quiz.setId(UUID.randomUUID());
        quiz.setTitle("Đề 12A1");
        quiz.setActive(true);
        quiz.setGradeLevel("12");
        quiz.setTimeLimit(20);
        quiz.setGenerationStatus("READY");
        when(access.currentStudent()).thenReturn(student);
        when(quizRepository.findOfficialForClass("TOAN", classId)).thenReturn(List.of(quiz));
        when(quizQuestionRepository.countByQuizId(quiz.getId())).thenReturn(4L);
        when(quizAttemptRepository.existsByStudentIdAndQuizId(studentId, quiz.getId())).thenReturn(false);

        var assigned = service.getAssignedQuizzes("TOAN");

        assertEquals(1, assigned.size());
        assertEquals(quiz.getId(), assigned.get(0).getId());
        assertEquals("PENDING", assigned.get(0).getStatus());
    }

    @Test
    void quizForAnotherGradeInsideTheSameClassIsHidden() {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(UUID.randomUUID());
        schoolClass.setGradeLevel("12");
        Student student = new Student();
        student.setId(UUID.randomUUID());
        student.setGradeLevel("12");
        student.setClassEntity(schoolClass);
        Quiz quiz = new Quiz();
        quiz.setId(UUID.randomUUID());
        quiz.setActive(true);
        quiz.setGradeLevel("10");
        quiz.setGenerationStatus("READY");
        when(access.currentStudent()).thenReturn(student);
        when(quizRepository.findOfficialForClass("TOAN", schoolClass.getId())).thenReturn(List.of(quiz));

        assertTrue(service.getAssignedQuizzes("TOAN").isEmpty());
    }
}
