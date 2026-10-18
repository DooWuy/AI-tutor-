package com.vn.aitutor.service.quiz;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.repository.QuizClassAssignmentRepository;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QuizAccessServiceTest {

    @Mock private UserRepository users;
    @Mock private StudentRepository students;
    @Mock private QuizRepository quizzes;
    @Mock private QuizQuestionRepository questions;
    @Mock private QuizClassAssignmentRepository assignments;
    @InjectMocks private QuizAccessService service;

    private Student student;
    private SchoolClass schoolClass;
    private Quiz quiz;

    @BeforeEach
    void setUp() {
        User owner = new User();
        owner.setId(UUID.randomUUID());
        schoolClass = new SchoolClass();
        schoolClass.setId(UUID.randomUUID());
        schoolClass.setGradeLevel("12");
        student = new Student();
        student.setUser(owner);
        student.setClassEntity(schoolClass);
        student.setGradeLevel("12");
        quiz = new Quiz();
        quiz.setId(UUID.randomUUID());
        quiz.setActive(true);
        quiz.setGradeLevel("12");
        quiz.setGenerationStatus("READY");
        User teacher = new User();
        teacher.setId(UUID.randomUUID());
        quiz.setCreatedBy(teacher);
    }

    @Test
    void officialQuizOutsideTheClassIsRejected() {
        when(quizzes.findById(quiz.getId())).thenReturn(Optional.of(quiz));
        when(assignments.existsByQuiz_IdAndSchoolClass_Id(quiz.getId(), schoolClass.getId())).thenReturn(false);

        assertThrows(ResourceForbiddenException.class, () -> service.requireQuiz(quiz.getId(), student));
    }

    @Test
    void studentWithoutAClassCannotOpenAnOfficialQuiz() {
        student.setClassEntity(null);
        when(quizzes.findById(quiz.getId())).thenReturn(Optional.of(quiz));

        assertThrows(ResourceForbiddenException.class, () -> service.requireQuiz(quiz.getId(), student));
        verify(assignments, never()).existsByQuiz_IdAndSchoolClass_Id(any(), any());
    }

    @Test
    void assignedOfficialQuizIsOpen() {
        when(quizzes.findById(quiz.getId())).thenReturn(Optional.of(quiz));
        when(assignments.existsByQuiz_IdAndSchoolClass_Id(quiz.getId(), schoolClass.getId())).thenReturn(true);

        assertSame(quiz, service.requireQuiz(quiz.getId(), student));
    }

    @Test
    void ownPracticeQuizDoesNotNeedAClassAssignment() {
        quiz.setAiGenerated(true);
        quiz.setCreatedBy(student.getUser());
        when(quizzes.findById(quiz.getId())).thenReturn(Optional.of(quiz));

        assertSame(quiz, service.requireQuiz(quiz.getId(), student));
        verify(assignments, never()).existsByQuiz_IdAndSchoolClass_Id(any(), any());
    }
}
