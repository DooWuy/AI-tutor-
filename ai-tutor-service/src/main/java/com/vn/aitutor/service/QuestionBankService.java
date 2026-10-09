package com.vn.aitutor.service;

import com.vn.aitutor.curriculum.GradeLevels;
import com.vn.aitutor.dto.request.GenerateQuestionsRequest;
import com.vn.aitutor.dto.request.QuestionChoiceRequest;
import com.vn.aitutor.dto.request.QuestionUpsertRequest;
import com.vn.aitutor.dto.response.ChoiceResponse;
import com.vn.aitutor.dto.response.QuestionBatchResponse;
import com.vn.aitutor.dto.response.QuestionResponse;
import com.vn.aitutor.dto.response.SkillResponse;
import com.vn.aitutor.entity.Lesson;
import com.vn.aitutor.entity.QuestionBankItem;
import com.vn.aitutor.entity.QuestionChoice;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.DocumentType;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.entity.enums.ReviewStatus;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.quiz.ChoiceInput;
import com.vn.aitutor.quiz.NormalizedQuestion;
import com.vn.aitutor.quiz.QuestionContentRules;
import com.vn.aitutor.repository.DocumentChunkRepository;
import com.vn.aitutor.repository.LessonRepository;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.QuestionChoiceRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.repository.projection.SkillSummaryRow;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.QuestionComposer.ComposeRequest;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuestionBankService {

    static final int CONTEXT_BUDGET = 8000;
    static final String NO_THEORY_WARNING =
            "Kỹ năng chưa có tài liệu lý thuyết. AI soạn theo tên kỹ năng.";

    private final QuestionBankRepository questionBankRepository;
    private final QuestionChoiceRepository questionChoiceRepository;
    private final LessonRepository lessonRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final UserRepository userRepository;
    private final QuestionComposer questionComposer;

    @Transactional(readOnly = true)
    public List<SkillResponse> listSkills(String subject, String gradeLevel) {
        String subjectCode = blank(subject) ? null : SubjectCode.parseRequired(subject).name();
        String grade = blank(gradeLevel) ? null : GradeLevels.normalize(gradeLevel);
        return lessonRepository.findSkills(subjectCode, grade).stream().map(this::toSkill).toList();
    }

    @Transactional(readOnly = true)
    public List<QuestionResponse> listQuestions(UUID lessonId) {
        requireLesson(lessonId);
        return questionBankRepository.findByLessonAndStatus(lessonId, ReviewStatus.ACTIVE).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuestionResponse getQuestion(UUID questionId) {
        return toResponse(requireQuestion(questionId));
    }

    @Transactional
    public QuestionResponse create(UUID lessonId, QuestionUpsertRequest request, UserPrincipal principal) {
        Lesson lesson = requireLesson(lessonId);
        QuestionBankItem item = new QuestionBankItem();
        item.setLesson(lesson);
        item.setCreatedBy(author(principal));
        item.setReviewStatus(ReviewStatus.ACTIVE);
        apply(item, normalize(request));
        return toResponse(questionBankRepository.save(item));
    }

    @Transactional
    public QuestionResponse update(UUID questionId, QuestionUpsertRequest request) {
        QuestionBankItem item = requireQuestion(questionId);
        apply(item, normalize(request));
        return toResponse(questionBankRepository.save(item));
    }

    @Transactional
    public QuestionResponse updateInBatch(UUID batchId, UUID questionId, QuestionUpsertRequest request) {
        QuestionBankItem item = requireBatchQuestion(batchId, questionId);
        apply(item, normalize(request));
        return toResponse(questionBankRepository.save(item));
    }

    @Transactional
    public void delete(UUID questionId) {
        if (!questionBankRepository.existsById(questionId)) {
            throw new ResourceNotFoundException("Không tìm thấy câu hỏi");
        }
        questionChoiceRepository.deleteByQuestionIdIn(List.of(questionId));
        questionBankRepository.deleteAllById(List.of(questionId));
    }

    @Transactional
    public void deleteInBatch(UUID batchId, UUID questionId) {
        requireBatchQuestion(batchId, questionId);
        delete(questionId);
    }

    @Transactional
    public int bulkDelete(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new ResourceBadRequestException("Hãy chọn ít nhất một câu hỏi");
        }
        List<UUID> distinct = new ArrayList<>(new LinkedHashSet<>(ids));
        if (questionBankRepository.countByIdIn(distinct) != distinct.size()) {
            throw new ResourceNotFoundException("Không tìm thấy một hoặc nhiều câu hỏi đã chọn");
        }
        questionChoiceRepository.deleteByQuestionIdIn(distinct);
        questionBankRepository.deleteAllById(distinct);
        return distinct.size();
    }

    @Transactional(readOnly = true)
    public QuestionType validateGenerate(UUID lessonId, GenerateQuestionsRequest request) {
        if (request == null || request.getDifficulty() == null || request.getCount() == null) {
            throw new ResourceBadRequestException("Độ khó và số lượng câu hỏi không được để trống");
        }
        QuestionType type = resolveType(request.getQuestionType());
        QuestionContentRules.requireDifficulty(request.getDifficulty());
        QuestionContentRules.requireGenerateCount(request.getCount());
        requireLesson(lessonId);
        return type;
    }

    @Transactional(readOnly = true)
    public List<QuestionResponse> listPendingBatch(UUID batchId) {
        if (batchId == null) {
            return List.of();
        }
        return questionBankRepository.findByBatchIdAndReviewStatusOrderByCreatedAtAsc(batchId, ReviewStatus.PENDING)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public QuestionBatchResponse generate(UUID lessonId, GenerateQuestionsRequest request, UserPrincipal principal) {
        int difficulty = request.getDifficulty();
        int count = request.getCount();
        QuestionType type = resolveType(request.getQuestionType());
        QuestionContentRules.requireDifficulty(difficulty);
        QuestionContentRules.requireGenerateCount(count);
        Lesson lesson = requireLesson(lessonId);
        String context = theoryContext(lessonId);
        String warning = context.isBlank() ? NO_THEORY_WARNING : null;
        List<NormalizedQuestion> drafted = questionComposer.compose(new ComposeRequest(
                lesson.getTitle(),
                subjectLabel(lesson),
                lesson.getChapter().getBook().getGradeLevel(),
                lesson.getTitle(),
                context,
                difficulty,
                count,
                type,
                type == QuestionType.TRUE_FALSE ? 2 : 4));
        UUID batchId = UUID.randomUUID();
        User author = author(principal);
        List<QuestionResponse> saved = new ArrayList<>();
        for (NormalizedQuestion draft : drafted) {
            QuestionBankItem item = new QuestionBankItem();
            item.setLesson(lesson);
            item.setCreatedBy(author);
            item.setReviewStatus(ReviewStatus.PENDING);
            item.setBatchId(batchId);
            apply(item, draft);
            saved.add(toResponse(questionBankRepository.save(item)));
        }
        return QuestionBatchResponse.builder().batchId(batchId).warning(warning).questions(saved).build();
    }

    @Transactional
    public List<QuestionResponse> confirm(UUID batchId) {
        List<QuestionBankItem> pending = pendingBatch(batchId);
        pending.forEach(item -> item.setReviewStatus(ReviewStatus.ACTIVE));
        return questionBankRepository.saveAll(pending).stream().map(this::toResponse).toList();
    }

    @Transactional
    public void discard(UUID batchId) {
        List<QuestionBankItem> pending = pendingBatch(batchId);
        List<UUID> ids = pending.stream().map(QuestionBankItem::getId).toList();
        questionChoiceRepository.deleteByQuestionIdIn(ids);
        questionBankRepository.deleteAllById(ids);
    }

    private QuestionType resolveType(String raw) {
        if (raw == null || raw.isBlank()) {
            return QuestionType.MULTIPLE_CHOICE;
        }
        try {
            return QuestionType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResourceBadRequestException("Loại câu hỏi phải là trắc nghiệm, đúng/sai hoặc điền từ");
        }
    }

    public String theoryContext(UUID lessonId) {
        String theory = joinChunks(documentChunkRepository.findContentByLessonAndType(lessonId, DocumentType.THEORY));
        if (!theory.isBlank()) {
            return theory;
        }
        return joinChunks(documentChunkRepository.findContentByLessonAndType(lessonId, DocumentType.EXERCISE));
    }

    private List<QuestionBankItem> pendingBatch(UUID batchId) {
        List<QuestionBankItem> pending =
                questionBankRepository.findByBatchIdAndReviewStatusOrderByCreatedAtAsc(batchId, ReviewStatus.PENDING);
        if (pending.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy lô câu hỏi cần duyệt");
        }
        return pending;
    }

    private QuestionBankItem requireBatchQuestion(UUID batchId, UUID questionId) {
        QuestionBankItem item = requireQuestion(questionId);
        if (item.getReviewStatus() != ReviewStatus.PENDING || batchId == null || !batchId.equals(item.getBatchId())) {
            throw new ResourceNotFoundException("Không tìm thấy câu hỏi trong lô đang duyệt");
        }
        return item;
    }

    private Lesson requireLesson(UUID lessonId) {
        return lessonRepository.findWithBook(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỹ năng"));
    }

    private QuestionBankItem requireQuestion(UUID questionId) {
        return questionBankRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi"));
    }

    private User author(UserPrincipal principal) {
        if (principal == null || principal.getUsers() == null) {
            throw new ResourceBadRequestException("Không xác định được người tạo câu hỏi");
        }
        return userRepository.getReferenceById(principal.getUsers().getId());
    }

    private NormalizedQuestion normalize(QuestionUpsertRequest request) {
        List<ChoiceInput> choices = new ArrayList<>();
        if (request.getChoices() != null) {
            for (QuestionChoiceRequest choice : request.getChoices()) {
                choices.add(new ChoiceInput(choice.getKey(), choice.getText(), choice.isCorrect()));
            }
        }
        return QuestionContentRules.require(
                request.getStem(),
                request.getExplanation(),
                QuestionType.parseOrDefault(request.getQuestionType()),
                choices,
                request.getTags(),
                request.getDifficulty(),
                request.getCorrectText(),
                null,
                false);
    }

    private void apply(QuestionBankItem item, NormalizedQuestion question) {
        item.setStem(question.stem());
        item.setExplanation(question.explanation());
        item.setDifficulty(question.difficulty());
        item.setQuestionType(question.type());
        item.setTags(new ArrayList<>(question.tags()));
        item.setCorrectText(question.correctText());
        item.getChoices().clear();
        if (item.getId() != null) {
            questionBankRepository.flush();
        }
        int order = 0;
        for (ChoiceInput choice : question.choices()) {
            QuestionChoice row = new QuestionChoice();
            row.setQuestion(item);
            row.setChoiceKey(choice.key());
            row.setChoiceText(choice.text());
            row.setCorrect(choice.correct());
            row.setDisplayOrder(order++);
            item.getChoices().add(row);
        }
    }

    private QuestionResponse toResponse(QuestionBankItem item) {
        Lesson lesson = item.getLesson();
        List<ChoiceResponse> choices = item.getChoices().stream()
                .map(choice -> ChoiceResponse.builder()
                        .id(choice.getId())
                        .key(choice.getChoiceKey())
                        .text(choice.getChoiceText())
                        .correct(choice.isCorrect())
                        .displayOrder(choice.getDisplayOrder())
                        .build())
                .toList();
        return QuestionResponse.builder()
                .id(item.getId())
                .lessonId(lesson == null ? null : lesson.getId())
                .skillCode(lesson == null ? null : lesson.getLessonCode())
                .skillName(lesson == null ? null : lesson.getTitle())
                .stem(item.getStem())
                .explanation(item.getExplanation())
                .difficulty(item.getDifficulty())
                .questionType(item.getQuestionType().name())
                .reviewStatus(item.getReviewStatus().name())
                .tags(item.getTags() == null ? List.of() : List.copyOf(item.getTags()))
                .choices(choices)
                .correctText(item.getCorrectText())
                .batchId(item.getBatchId())
                .build();
    }

    private SkillResponse toSkill(SkillSummaryRow row) {
        return SkillResponse.builder()
                .id(row.getLessonId())
                .skillCode(row.getLessonCode())
                .name(row.getTitle())
                .subject(row.getSubject())
                .gradeLevel(row.getGradeLevel())
                .questionCount(row.getQuestionCount() == null ? 0 : row.getQuestionCount())
                .build();
    }

    private String subjectLabel(Lesson lesson) {
        String subject = lesson.getChapter().getBook().getSubject();
        try {
            return SubjectCode.parseRequired(subject).getDisplayName();
        } catch (RuntimeException ex) {
            return subject;
        }
    }

    private String joinChunks(List<String> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        for (String chunk : chunks) {
            if (chunk == null || chunk.isBlank()) {
                continue;
            }
            if (builder.length() > 0) {
                builder.append("\n\n");
            }
            if (builder.length() >= CONTEXT_BUDGET) {
                break;
            }
            int room = CONTEXT_BUDGET - builder.length();
            builder.append(chunk.length() <= room ? chunk : chunk.substring(0, room));
        }
        return builder.toString();
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
