package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.dto.request.EnrollmentActionRequest;
import com.vn.aitutor.dto.request.StudyClassCreateRequest;
import com.vn.aitutor.dto.request.StudyClassJoinRequest;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.StudyClass;
import com.vn.aitutor.entity.StudyClassEnrollment;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.EnrollmentStatus;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.StudyClassStatus;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.StudyClassEnrollmentRepository;
import com.vn.aitutor.repository.StudyClassRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StudyClassServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Mock private StudyClassRepository studyClassRepository;
    @Mock private StudyClassEnrollmentRepository enrollmentRepository;
    @Mock private TeacherRepository teacherRepository;
    @Mock private StudentRepository studentRepository;

    private StudyClassService service;
    private Teacher teacher;
    private UserPrincipal teacherPrincipal;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-10-15T03:00:00Z"), ZONE);
        service = new StudyClassService(studyClassRepository, enrollmentRepository, teacherRepository, studentRepository, clock);
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(Role.TEACHER);
        teacher = new Teacher();
        teacher.setId(UUID.randomUUID());
        teacher.setUser(user);
        teacherPrincipal = UserPrincipal.builder().users(user).build();
    }

    @Test
    void createStopsAtFourActiveClasses() {
        when(teacherRepository.findByUserId(teacher.getUser().getId())).thenReturn(Optional.of(teacher));
        when(studyClassRepository.countByTeacher_IdAndStatus(teacher.getId(), StudyClassStatus.ACTIVE)).thenReturn(4L);
        StudyClassCreateRequest request = new StudyClassCreateRequest();
        request.setName("Lớp toán");

        ResourceBadRequestException error = assertThrows(ResourceBadRequestException.class, () -> service.create(teacherPrincipal, request));

        assertEquals("Bạn đã có 4 lớp đang hoạt động", error.getMessage());
        verify(studyClassRepository, never()).save(any());
    }

    @Test
    void createStoresASixCharacterCode() {
        when(teacherRepository.findByUserId(teacher.getUser().getId())).thenReturn(Optional.of(teacher));
        when(studyClassRepository.countByTeacher_IdAndStatus(teacher.getId(), StudyClassStatus.ACTIVE)).thenReturn(3L);
        when(studyClassRepository.existsByClassCode(any())).thenReturn(false);
        when(studyClassRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        StudyClassCreateRequest request = new StudyClassCreateRequest();
        request.setName("Lớp toán");
        request.setDurationAmount(2);
        request.setDurationUnit("WEEKS");

        var created = service.create(teacherPrincipal, request);

        assertEquals(6, created.getClassCode().length());
        assertEquals(StudyClassStatus.ACTIVE, created.getStatus());
        assertEquals(40, created.getMaxStudents());
        assertEquals(LocalDate.of(2026, 10, 29), created.getEndDate());
    }

    @Test
    void joinUnknownCodeIsNotFound() {
        UserPrincipal studentPrincipal = studentPrincipal();
        when(studentRepository.findByUserId(studentPrincipal.getUsers().getId())).thenReturn(Optional.of(studentOf(studentPrincipal)));
        when(studyClassRepository.findByClassCode("AB12CD")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.join(studentPrincipal, joinRequest("ab12cd")));
    }

    @Test
    void joinDissolvedClassIsRejected() {
        UserPrincipal studentPrincipal = studentPrincipal();
        StudyClass studyClass = ownedClass();
        studyClass.setStatus(StudyClassStatus.DISSOLVED);
        when(studentRepository.findByUserId(studentPrincipal.getUsers().getId())).thenReturn(Optional.of(studentOf(studentPrincipal)));
        when(studyClassRepository.findByClassCode("AB12CD")).thenReturn(Optional.of(studyClass));

        assertThrows(ResourceBadRequestException.class, () -> service.join(studentPrincipal, joinRequest("AB12CD")));
    }

    @Test
    void approveStopsWhenTheClassIsFull() {
        StudyClass studyClass = ownedClass();
        studyClass.setMaxStudents(1);
        StudyClassEnrollment enrollment = pendingEnrollment(studyClass);
        when(teacherRepository.findByUserId(teacher.getUser().getId())).thenReturn(Optional.of(teacher));
        when(studyClassRepository.findById(studyClass.getId())).thenReturn(Optional.of(studyClass));
        when(enrollmentRepository.findByIdAndStudyClass_Id(enrollment.getId(), studyClass.getId())).thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.countByStudyClass_IdAndStatus(studyClass.getId(), EnrollmentStatus.APPROVED)).thenReturn(1L);

        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class,
                () -> service.act(teacherPrincipal, studyClass.getId(), enrollment.getId(), action("approve")));

        assertEquals("Lớp đã đủ sĩ số", error.getMessage());
    }

    @Test
    void approveAndRejectUpdateTheRequest() {
        StudyClass studyClass = ownedClass();
        StudyClassEnrollment enrollment = pendingEnrollment(studyClass);
        when(teacherRepository.findByUserId(teacher.getUser().getId())).thenReturn(Optional.of(teacher));
        when(studyClassRepository.findById(studyClass.getId())).thenReturn(Optional.of(studyClass));
        when(enrollmentRepository.findByIdAndStudyClass_Id(enrollment.getId(), studyClass.getId())).thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.countByStudyClass_IdAndStatus(studyClass.getId(), EnrollmentStatus.APPROVED)).thenReturn(0L);
        when(enrollmentRepository.save(enrollment)).thenReturn(enrollment);

        var approved = service.act(teacherPrincipal, studyClass.getId(), enrollment.getId(), action("approve"));
        assertEquals(EnrollmentStatus.APPROVED, approved.getStatus());

        enrollment.setStatus(EnrollmentStatus.PENDING);
        var rejected = service.act(teacherPrincipal, studyClass.getId(), enrollment.getId(), action("reject"));
        assertEquals(EnrollmentStatus.REJECTED, rejected.getStatus());
    }

    @Test
    void rejectedStudentCanRequestAgain() {
        UserPrincipal studentPrincipal = studentPrincipal();
        Student student = studentOf(studentPrincipal);
        StudyClass studyClass = ownedClass();
        StudyClassEnrollment enrollment = pendingEnrollment(studyClass);
        enrollment.setStudent(student);
        enrollment.setStatus(EnrollmentStatus.REJECTED);
        when(studentRepository.findByUserId(student.getUser().getId())).thenReturn(Optional.of(student));
        when(studyClassRepository.findByClassCode("AB12CD")).thenReturn(Optional.of(studyClass));
        when(enrollmentRepository.findByStudyClass_IdAndStudent_Id(studyClass.getId(), student.getId())).thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.save(enrollment)).thenReturn(enrollment);

        var response = service.join(studentPrincipal, joinRequest("AB12CD"));

        assertEquals(EnrollmentStatus.PENDING, response.getStatus());
        assertEquals(EnrollmentStatus.PENDING, enrollment.getStatus());
    }

    @Test
    void teacherCannotOpenAnotherTeachersClass() {
        StudyClass studyClass = ownedClass();
        Teacher other = new Teacher();
        other.setId(UUID.randomUUID());
        studyClass.setTeacher(other);
        when(teacherRepository.findByUserId(teacher.getUser().getId())).thenReturn(Optional.of(teacher));
        when(studyClassRepository.findById(studyClass.getId())).thenReturn(Optional.of(studyClass));

        assertThrows(ResourceForbiddenException.class, () -> service.get(teacherPrincipal, studyClass.getId()));
    }

    @Test
    void pendingRequestCannotBeSentTwice() {
        UserPrincipal studentPrincipal = studentPrincipal();
        Student student = studentOf(studentPrincipal);
        StudyClass studyClass = ownedClass();
        StudyClassEnrollment enrollment = pendingEnrollment(studyClass);
        enrollment.setStudent(student);
        when(studentRepository.findByUserId(student.getUser().getId())).thenReturn(Optional.of(student));
        when(studyClassRepository.findByClassCode("AB12CD")).thenReturn(Optional.of(studyClass));
        when(enrollmentRepository.findByStudyClass_IdAndStudent_Id(studyClass.getId(), student.getId())).thenReturn(Optional.of(enrollment));

        assertThrows(ResourceConflictException.class, () -> service.join(studentPrincipal, joinRequest("AB12CD")));
    }

    private StudyClass ownedClass() {
        StudyClass studyClass = new StudyClass();
        studyClass.setId(UUID.randomUUID());
        studyClass.setName("Lớp toán");
        studyClass.setClassCode("AB12CD");
        studyClass.setTeacher(teacher);
        studyClass.setStatus(StudyClassStatus.ACTIVE);
        studyClass.setMaxStudents(40);
        studyClass.setStartDate(LocalDate.of(2026, 10, 1));
        return studyClass;
    }

    private StudyClassEnrollment pendingEnrollment(StudyClass studyClass) {
        User user = new User();
        user.setFullName("Học sinh A");
        user.setEmail("a@aitutor.vn");
        Student student = new Student();
        student.setId(UUID.randomUUID());
        student.setStudentCode("HS01");
        student.setUser(user);
        StudyClassEnrollment enrollment = new StudyClassEnrollment();
        enrollment.setId(UUID.randomUUID());
        enrollment.setStudyClass(studyClass);
        enrollment.setStudent(student);
        enrollment.setStatus(EnrollmentStatus.PENDING);
        enrollment.setRequestedAt(Instant.parse("2026-10-14T00:00:00Z"));
        return enrollment;
    }

    private UserPrincipal studentPrincipal() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(Role.STUDENT);
        user.setFullName("Học sinh A");
        user.setEmail("a@aitutor.vn");
        return UserPrincipal.builder().users(user).build();
    }

    private Student studentOf(UserPrincipal principal) {
        Student student = new Student();
        student.setId(UUID.randomUUID());
        student.setStudentCode("HS01");
        student.setUser(principal.getUsers());
        return student;
    }

    private StudyClassJoinRequest joinRequest(String code) {
        StudyClassJoinRequest request = new StudyClassJoinRequest();
        request.setClassCode(code);
        return request;
    }

    private EnrollmentActionRequest action(String action) {
        EnrollmentActionRequest request = new EnrollmentActionRequest();
        request.setAction(action);
        return request;
    }
}
