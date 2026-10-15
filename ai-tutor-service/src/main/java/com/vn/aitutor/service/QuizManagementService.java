package com.vn.aitutor.service;

import com.vn.aitutor.curriculum.GradeLevels;
import com.vn.aitutor.dto.request.QuizGenerateRequest;
import com.vn.aitutor.dto.request.QuizUpsertRequest;
import com.vn.aitutor.dto.response.QuizClassRef;
import com.vn.aitutor.dto.response.QuizQuestionResponse;
import com.vn.aitutor.dto.response.QuizResponse;
import com.vn.aitutor.entity.Lesson;
import com.vn.aitutor.entity.QuestionBankItem;
import com.vn.aitutor.entity.QuestionChoice;
import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.QuizClassAssignment;
import com.vn.aitutor.entity.QuizQuestion;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.entity.enums.QuizDifficulty;
import com.vn.aitutor.entity.enums.QuizStatus;
import com.vn.aitutor.entity.enums.ReviewStatus;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.quiz.NormalizedQuestion;
import com.vn.aitutor.quiz.QuestionContentRules;
import com.vn.aitutor.repository.LessonRepository;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.QuizClassAssignmentRepository;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.QuestionComposer.ComposeRequest;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuizManagementService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuestionBankRepository questionBankRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final QuestionBankService questionBankService;
    private final QuestionComposer questionComposer;
    private final QuizAccess quizAccess;
    private final SchoolClassRepository schoolClassRepository;
    private final TeacherRepository teacherRepository;
    private final TeacherClassAssignmentRepository assignmentRepository;
    private final QuizClassAssignmentRepository quizClassAssignmentRepository;

    @Transactional(readOnly = true)
    public List<QuizResponse> list(String subject, String gradeLevel, String status, UserPrincipal principal) {
        String subjectCode = blank(subject) ? null : SubjectCode.parseRequired(subject).name();
        String grade = blank(gradeLevel) ? null : GradeLevels.normalize(gradeLevel);
        QuizStatus quizStatus = QuizStatus.parseFilter(status);
        List<Quiz> quizzes = quizRepository.search(quizAccess.ownerFilter(principal), subjectCode, grade, quizStatus);
        List<UUID> ids = idsOf(quizzes);
        Map<UUID, Long> questions = ids.isEmpty() ? Map.of() : counts(quizQuestionRepository.countGrouped(ids));
        Map<UUID, Long> attempts = ids.isEmpty() ? Map.of() : counts(quizAttemptRepository.countGrouped(ids));
        Map<UUID, List<QuizClassRef>> classes = classesOf(ids);
        return quizzes.stream()
                .map(quiz -> toResponse(quiz, questions.getOrDefault(quiz.getId(), 0L).intValue(),
                        attempts.getOrDefault(quiz.getId(), 0L), null, classes.getOrDefault(quiz.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public QuizResponse get(UUID quizId, UserPrincipal principal) {
        Quiz quiz = quizAccess.require(quizId, principal);
        return detail(quiz);
    }

    @Transactional
    public QuizResponse create(QuizUpsertRequest request, UserPrincipal principal) {
        Quiz quiz = new Quiz();
        quiz.setCreatedBy(userRepository.getReferenceById(principal.getUsers().getId()));
        quiz.setDifficulty(QuizDifficulty.MEDIUM);
        quiz.setStatus(QuizStatus.DRAFT);
        quiz.setActive(false);
        apply(quiz, request);
        return detail(quizRepository.save(quiz));
    }

    @Transactional
    public QuizResponse update(UUID quizId, QuizUpsertRequest request, UserPrincipal principal) {
        Quiz quiz = quizAccess.require(quizId, principal);
        apply(quiz, request);
        return detail(quizRepository.save(quiz));
    }

    @Transactional
    public QuizResponse publish(UUID quizId, List<UUID> classIds, UserPrincipal principal) {
        Quiz quiz = quizAccess.require(quizId, principal);
        if (quizQuestionRepository.countByQuizId(quizId) == 0) {
            throw new ResourceBadRequestException("Đề thi cần ít nhất một câu hỏi trước khi phát hành");
        }
        List<SchoolClass> targets = resolveClasses(quiz, classIds, principal);
        replaceAssignments(quiz, targets, principal.getUsers());
        return changeStatus(quiz, QuizStatus.PUBLISHED);
    }

    @Transactional
    public QuizResponse archive(UUID quizId, UserPrincipal principal) {
        return changeStatus(quizAccess.require(quizId, principal), QuizStatus.ARCHIVED);
    }

    @Transactional
    public QuizResponse draft(UUID quizId, UserPrincipal principal) {
        return changeStatus(quizAccess.require(quizId, principal), QuizStatus.DRAFT);
    }

    @Transactional
    public void delete(UUID quizId, UserPrincipal principal) {
        Quiz quiz = quizAccess.require(quizId, principal);
        if (quizAttemptRepository.countByQuizId(quizId) > 0) {
            throw new ResourceBadRequestException(QuestionContentRules.DELETE_BLOCKED);
        }
        quizRepository.delete(quiz);
    }

    @Transactional
    public QuizResponse assign(UUID quizId, List<UUID> questionIds, UserPrincipal principal) {
        Quiz quiz = quizAccess.require(quizId, principal);
        assertQuestionsMutable(quiz);
        int order = quizQuestionRepository.maxOrderIndex(quizId);
        List<UUID> existingSources = new ArrayList<>(quizQuestionRepository.findSourceIds(quizId));
        for (UUID questionId : questionIds) {
            if (existingSources.contains(questionId)) {
                continue;
            }
            QuestionBankItem source = questionBankRepository.findById(questionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi trong ngân hàng"));
            assertBankQuestionMatches(quiz, source);
            quizQuestionRepository.save(snapshot(quiz, source, null, ++order));
            existingSources.add(questionId);
        }
        return detail(quiz);
    }

    @Transactional
    public QuizResponse removeQuestion(UUID quizId, UUID questionId, UserPrincipal principal) {
        Quiz quiz = quizAccess.require(quizId, principal);
        assertQuestionsMutable(quiz);
        QuizQuestion question = quizQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi trong đề"));
        if (!quizId.equals(question.getQuiz().getId())) {
            throw new ResourceNotFoundException("Không tìm thấy câu hỏi trong đề");
        }
        quizQuestionRepository.delete(question);
        return detail(quiz);
    }

    @Transactional(readOnly = true)
    public void validateGenerate(UUID quizId, QuizGenerateRequest request, UserPrincipal principal) {
        Quiz quiz = quizAccess.require(quizId, principal);
        assertQuestionsMutable(quiz);
        requireRatios(request);
    }

    @Transactional
    public QuizResponse generate(UUID quizId, QuizGenerateRequest request, UserPrincipal principal) {
        Quiz quiz = quizAccess.require(quizId, principal);
        assertQuestionsMutable(quiz);
        requireRatios(request);
        int stamped = (request.getMinDifficulty() + request.getMaxDifficulty()) / 2;
        if (stamped < 1) {
            stamped = request.getMinDifficulty();
        }
        String context = quiz.getLesson() == null ? "" : questionBankService.theoryContext(quiz.getLesson().getId());
        int order = quizQuestionRepository.maxOrderIndex(quizId);
        List<UUID> excluded = new ArrayList<>(quizQuestionRepository.findSourceIds(quizId));
        order = fillType(quiz, QuestionType.MULTIPLE_CHOICE, request.getMultipleChoice(), 4, request, stamped, context, excluded, order);
        order = fillType(quiz, QuestionType.MULTI_SELECT, countOf(request.getMultiSelect()), 4, request, stamped, context, excluded, order);
        order = fillType(quiz, QuestionType.TRUE_FALSE, request.getTrueFalse(), 2, request, stamped, context, excluded, order);
        fillType(quiz, QuestionType.FILL_BLANK, request.getFillBlank(), 0, request, stamped, context, excluded, order);
        quiz.setAiGenerated(true);
        return detail(quizRepository.save(quiz));
    }

    private void requireRatios(QuizGenerateRequest request) {
        int total = request.getMultipleChoice()
                + countOf(request.getMultiSelect())
                + request.getTrueFalse()
                + request.getFillBlank();
        if (total != request.getCount()) {
            throw new ResourceBadRequestException("Tổng tỷ lệ loại câu phải bằng số lượng câu hỏi");
        }
        if (request.getMinDifficulty() > request.getMaxDifficulty()) {
            throw new ResourceBadRequestException("Độ khó tối thiểu không được lớn hơn độ khó tối đa");
        }
    }

    private int countOf(Integer value) {
        return value == null ? 0 : value;
    }

    private int fillType(
            Quiz quiz,
            QuestionType type,
            int wanted,
            int exactChoices,
            QuizGenerateRequest request,
            int stampedDifficulty,
            String context,
            List<UUID> excluded,
            int order) {
        if (wanted <= 0) {
            return order;
        }
        List<QuestionBankItem> picked = questionBankRepository.findActiveForQuiz(
                type,
                request.getMinDifficulty(),
                request.getMaxDifficulty(),
                quiz.getSubject(),
                quiz.getGradeLevel(),
                excluded.isEmpty(),
                excluded.isEmpty() ? List.of(UUID.randomUUID()) : excluded);
        int fromBank = Math.min(wanted, picked.size());
        for (int i = 0; i < fromBank; i++) {
            QuestionBankItem source = picked.get(i);
            quizQuestionRepository.save(snapshot(quiz, source, null, ++order));
            excluded.add(source.getId());
        }
        int missing = wanted - fromBank;
        if (missing == 0) {
            return order;
        }
        List<NormalizedQuestion> drafted = questionComposer.compose(new ComposeRequest(
                request.getTopic(),
                subjectLabel(quiz.getSubject()),
                quiz.getGradeLevel(),
                request.getTopic(),
                context,
                stampedDifficulty,
                missing,
                type,
                exactChoices == 0 ? 4 : exactChoices));
        for (NormalizedQuestion draft : drafted) {
            quizQuestionRepository.save(snapshot(quiz, null, draft, ++order));
        }
        return order;
    }

    private QuizQuestion snapshot(Quiz quiz, QuestionBankItem source, NormalizedQuestion draft, int order) {
        QuizQuestion question = new QuizQuestion();
        question.setQuiz(quiz);
        question.setPoints(1);
        question.setOrderIndex(order);
        if (source != null) {
            question.setQuestionText(source.getStem());
            question.setExplanation(source.getExplanation());
            question.setDifficulty(source.getDifficulty());
            question.setQuestionType(source.getQuestionType());
            question.setTags(source.getTags() == null ? new ArrayList<>() : new ArrayList<>(source.getTags()));
            question.setCorrectText(source.getCorrectText());
            question.setTopic(source.getLesson() == null ? null : source.getLesson().getTitle());
            question.setSourceQuestion(source);
            question.setOptions(optionsOf(source.getChoices(), source.getQuestionType() == QuestionType.MULTI_SELECT));
            question.setCorrectOptionKey(correctKey(source.getChoices()));
            return question;
        }
        question.setQuestionText(draft.stem());
        question.setExplanation(draft.explanation());
        question.setDifficulty(draft.difficulty());
        question.setQuestionType(draft.type());
        question.setTags(new ArrayList<>(draft.tags()));
        question.setCorrectText(draft.correctText());
        question.setTopic(draft.type().name());
        List<Map<String, Object>> options = new ArrayList<>();
        List<String> correctKeys = new ArrayList<>();
        boolean multi = draft.type() == QuestionType.MULTI_SELECT;
        for (var choice : draft.choices()) {
            Map<String, Object> option = new LinkedHashMap<>();
            option.put("key", choice.key());
            option.put("text", choice.text());
            if (multi) {
                option.put("content", choice.text());
            }
            options.add(option);
            if (choice.correct()) {
                correctKeys.add(choice.key());
            }
        }
        question.setOptions(options);
        question.setCorrectOptionKey(correctKeys.isEmpty() ? null : String.join(",", correctKeys));
        return question;
    }

    private List<Map<String, Object>> optionsOf(List<QuestionChoice> choices, boolean includeContent) {
        List<Map<String, Object>> options = new ArrayList<>();
        if (choices == null) {
            return options;
        }
        for (QuestionChoice choice : choices) {
            Map<String, Object> option = new LinkedHashMap<>();
            option.put("key", choice.getChoiceKey());
            option.put("text", choice.getChoiceText());
            if (includeContent) {
                option.put("content", choice.getChoiceText());
            }
            options.add(option);
        }
        return options;
    }

    private String correctKey(List<QuestionChoice> choices) {
        if (choices == null) {
            return null;
        }
        String joined = choices.stream()
                .filter(QuestionChoice::isCorrect)
                .map(QuestionChoice::getChoiceKey)
                .filter(key -> key != null && !key.isBlank())
                .collect(Collectors.joining(","));
        return joined.isEmpty() ? null : joined;
    }

    private void assertBankQuestionMatches(Quiz quiz, QuestionBankItem source) {
        if (source.getReviewStatus() != ReviewStatus.ACTIVE) {
            throw new ResourceBadRequestException("Chỉ gán được câu hỏi đã nạp vào ngân hàng");
        }
        Lesson lesson = source.getLesson();
        String subject = lesson.getChapter().getBook().getSubject();
        String grade = lesson.getChapter().getBook().getGradeLevel();
        if (!quiz.getSubject().equals(subject) || !quiz.getGradeLevel().equals(grade)) {
            throw new ResourceBadRequestException("Câu hỏi không cùng môn hoặc khối với đề thi");
        }
    }

    private void assertQuestionsMutable(Quiz quiz) {
        if (quizAttemptRepository.countByQuizId(quiz.getId()) > 0) {
            throw new ResourceBadRequestException("Đề thi đã có học sinh làm bài nên không đổi được bộ câu hỏi");
        }
    }

    private void apply(Quiz quiz, QuizUpsertRequest request) {
        String subject = SubjectCode.parseRequired(request.getSubject()).name();
        String grade = GradeLevels.normalize(request.getGradeLevel());
        Lesson lesson = null;
        if (request.getLessonId() != null) {
            lesson = lessonRepository.findWithBook(request.getLessonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học"));
            if (!subject.equals(lesson.getChapter().getBook().getSubject())
                    || !grade.equals(lesson.getChapter().getBook().getGradeLevel())) {
                throw new ResourceBadRequestException("Bài học không thuộc môn và khối của đề thi");
            }
        }
        quiz.setTitle(request.getTitle().trim());
        quiz.setDescription(blank(request.getDescription()) ? null : request.getDescription().trim());
        quiz.setSubject(subject);
        quiz.setGradeLevel(grade);
        quiz.setLesson(lesson);
        quiz.setTimeLimit(request.getTimeLimitMinutes());
        quiz.setMaxAttempts(request.getMaxAttempts());
        quiz.setPassingScore(request.getPassingScore());
    }

    private QuizResponse changeStatus(Quiz quiz, QuizStatus status) {
        quiz.setStatus(status);
        quiz.setActive(status == QuizStatus.PUBLISHED);
        return detail(quizRepository.save(quiz));
    }

    private List<SchoolClass> resolveClasses(Quiz quiz, List<UUID> classIds, UserPrincipal principal) {
        if (classIds == null || classIds.isEmpty()) {
            throw new ResourceBadRequestException("Chọn ít nhất một lớp để phát hành");
        }
        LinkedHashSet<UUID> distinct = new LinkedHashSet<>();
        for (UUID classId : classIds) {
            if (classId != null) {
                distinct.add(classId);
            }
        }
        if (distinct.isEmpty()) {
            throw new ResourceBadRequestException("Chọn ít nhất một lớp để phát hành");
        }
        User user = principal.getUsers();
        Teacher teacher = null;
        if (user.getRole() == Role.TEACHER) {
            teacher = teacherRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceForbiddenException("Tài khoản không gắn với hồ sơ giáo viên"));
        } else if (user.getRole() != Role.ADMIN) {
            throw new ResourceForbiddenException("Bạn không có quyền phát hành đề thi");
        }
        String quizGrade = GradeLevels.normalize(quiz.getGradeLevel());
        List<SchoolClass> targets = new ArrayList<>();
        for (UUID classId : distinct) {
            SchoolClass schoolClass = schoolClassRepository.findById(classId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
            if (teacher != null && !assignmentRepository.existsByTeacher_IdAndSchoolClass_Id(teacher.getId(), classId)) {
                throw new ResourceForbiddenException("Giáo viên không được phân công lớp này");
            }
            if (!quizGrade.equals(GradeLevels.normalize(schoolClass.getGradeLevel()))) {
                throw new ResourceBadRequestException("Lớp không cùng khối với đề thi");
            }
            targets.add(schoolClass);
        }
        return targets;
    }

    private void replaceAssignments(Quiz quiz, List<SchoolClass> targets, User actor) {
        quizClassAssignmentRepository.deleteByQuizId(quiz.getId());
        User assignedBy = userRepository.getReferenceById(actor.getId());
        for (SchoolClass schoolClass : targets) {
            QuizClassAssignment row = new QuizClassAssignment();
            row.setQuiz(quiz);
            row.setSchoolClass(schoolClass);
            row.setAssignedBy(assignedBy);
            quizClassAssignmentRepository.save(row);
        }
    }

    private QuizResponse detail(Quiz quiz) {
        List<QuizQuestionResponse> questions = quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(quiz.getId()).stream()
                .map(this::toQuestion)
                .toList();
        List<QuizClassRef> classes = classesOf(List.of(quiz.getId())).getOrDefault(quiz.getId(), List.of());
        return toResponse(quiz, questions.size(), quizAttemptRepository.countByQuizId(quiz.getId()), questions, classes);
    }

    private Map<UUID, List<QuizClassRef>> classesOf(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        List<QuizClassAssignment> rows = quizClassAssignmentRepository.findByQuizIdIn(ids);
        if (rows == null || rows.isEmpty()) {
            return Map.of();
        }
        Map<UUID, List<QuizClassRef>> map = new LinkedHashMap<>();
        for (QuizClassAssignment row : rows) {
            if (row.getQuiz() == null || row.getSchoolClass() == null) {
                continue;
            }
            map.computeIfAbsent(row.getQuiz().getId(), ignored -> new ArrayList<>())
                    .add(QuizClassRef.builder()
                            .id(row.getSchoolClass().getId())
                            .name(row.getSchoolClass().getName())
                            .gradeLevel(row.getSchoolClass().getGradeLevel())
                            .build());
        }
        return map;
    }

    private QuizResponse toResponse(
            Quiz quiz,
            int questionCount,
            long attemptCount,
            List<QuizQuestionResponse> questions,
            List<QuizClassRef> classes) {
        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .subject(quiz.getSubject())
                .gradeLevel(quiz.getGradeLevel())
                .lessonId(quiz.getLesson() == null ? null : quiz.getLesson().getId())
                .lessonTitle(quiz.getLesson() == null ? null : quiz.getLesson().getTitle())
                .timeLimitMinutes(quiz.getTimeLimit() == null ? 30 : quiz.getTimeLimit())
                .maxAttempts(quiz.getMaxAttempts())
                .passingScore(quiz.getPassingScore())
                .status(quiz.getStatus().name())
                .aiGenerated(quiz.isAiGenerated())
                .questionCount(questionCount)
                .attemptCount(attemptCount)
                .createdByName(quiz.getCreatedBy() == null ? null : quiz.getCreatedBy().getFullName())
                .createdAt(quiz.getCreatedAt())
                .questions(questions)
                .classes(classes == null ? List.of() : classes)
                .build();
    }

    private QuizQuestionResponse toQuestion(QuizQuestion question) {
        return QuizQuestionResponse.builder()
                .id(question.getId())
                .stem(question.getQuestionText())
                .explanation(question.getExplanation())
                .difficulty(question.getDifficulty())
                .questionType(question.getQuestionType() == null ? QuestionType.MULTIPLE_CHOICE.name() : question.getQuestionType().name())
                .tags(question.getTags() == null ? List.of() : List.copyOf(question.getTags()))
                .options(question.getOptions())
                .correctOptionKey(question.getCorrectOptionKey())
                .correctText(question.getCorrectText())
                .orderIndex(question.getOrderIndex())
                .sourceQuestionId(question.getSourceQuestion() == null ? null : question.getSourceQuestion().getId())
                .build();
    }

    private Map<UUID, Long> counts(List<Object[]> rows) {
        Map<UUID, Long> map = new HashMap<>();
        if (rows == null) {
            return map;
        }
        for (Object[] row : rows) {
            map.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }

    private List<UUID> idsOf(List<Quiz> quizzes) {
        return quizzes.stream().map(Quiz::getId).toList();
    }

    private String subjectLabel(String subject) {
        try {
            return SubjectCode.parseRequired(subject).getDisplayName();
        } catch (RuntimeException ex) {
            return subject;
        }
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
