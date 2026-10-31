package com.vn.aitutor.mq.consumer;

import com.vn.aitutor.ai.agent.QuestionGeneratorAgent;
import com.vn.aitutor.config.RabbitMQConfig;
import com.vn.aitutor.dto.request.quiz.QuestionBankCreateRequest;
import com.vn.aitutor.dto.request.quiz.QuizGenerationMessage;
import com.vn.aitutor.dto.response.quiz.QuestionBankListResponse;
import com.vn.aitutor.entity.QuestionBankItem;
import com.vn.aitutor.entity.QuestionChoice;
import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.QuizQuestion;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import com.vn.aitutor.service.system.notification.NotificationCreationService;
import com.vn.aitutor.service.system.notification.NotificationCommands;
import com.vn.aitutor.service.quiz.QuizAccessService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizGenerationConsumer{

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuestionBankRepository questionBankRepository;
    private final QuestionGeneratorAgent questionGeneratorAgent;
    private final NotificationCreationService notifications;
    private final org.springframework.transaction.support.TransactionTemplate transactions;

    @RabbitListener(queues = RabbitMQConfig.QUIZ_GENERATION_QUEUE)
    public void handleQuizGeneration(QuizGenerationMessage message) {
        log.info("Received quiz generation request for quizId: {}", message.getQuizId());
        Quiz quiz = quizRepository.findById(message.getQuizId()).orElse(null);
        if (quiz == null || terminal(quiz)) return;
        List<QuestionBankCreateRequest> allQuestions;
        try {
            allQuestions = generateQuestions(message);
            // Invalid AI output is a generation failure, not a persistence failure.
            for (QuestionBankCreateRequest question : allQuestions) toQuizQuestion(question, message);
        } catch (RuntimeException generationError) {
            if (generationError instanceof org.springframework.dao.DataAccessException
                    || generationError instanceof jakarta.persistence.PersistenceException) throw generationError;
            log.warn("Quiz generation failed for {} ({})", message.getQuizId(), generationError.getClass().getSimpleName());
            transactions.executeWithoutResult(tx -> {
                Quiz lockedQuiz = quizRepository.lockById(message.getQuizId()).orElse(null);
                if (lockedQuiz == null || terminal(lockedQuiz)) return;
                lockedQuiz.setGenerationStatus("FAILED");
                quizRepository.save(lockedQuiz);
                notifyResult(lockedQuiz, false);
            });
            return;
        }

        // A DB/notification failure escapes to RabbitMQ for redelivery. Do not turn it into FAILED.
        transactions.executeWithoutResult(tx -> {
            Quiz lockedQuiz = quizRepository.lockById(message.getQuizId()).orElse(null);
            if (lockedQuiz == null || terminal(lockedQuiz)) return;
            int orderIndex = 1;
            for (QuestionBankCreateRequest question : allQuestions) {
                QuizQuestion generated = toQuizQuestion(question, message);
                generated.setQuiz(lockedQuiz);
                generated.setOrderIndex(orderIndex++);
                quizQuestionRepository.save(generated);
            }
            lockedQuiz.setActive(true);
            lockedQuiz.setGenerationStatus("READY");
            quizRepository.save(lockedQuiz);
            notifyResult(lockedQuiz, true);
        });
    }

    private boolean terminal(Quiz quiz) {
        return "READY".equals(quiz.getGenerationStatus()) || "FAILED".equals(quiz.getGenerationStatus());
    }

    private void notifyResult(Quiz quiz, boolean success) {
        var owner = quiz.getCreatedBy();
        notifications.create(NotificationCommands.quizResult(owner.getId(), owner.getRole(),
                quiz.getId(), null, quiz.getSubject(), success));
    }

    private List<QuestionBankCreateRequest> generateQuestions(QuizGenerationMessage message) {
        List<QuestionBankItem> existingQuestions = List.of();
        if (message.getTopic() != null && !message.getTopic().isBlank()) {
            existingQuestions = questionBankRepository.findActiveByStemAndDifficulty(
                    message.getTopic(), message.getDifficulty());
            if (existingQuestions.size() > message.getCount()) {
                existingQuestions = existingQuestions.subList(0, message.getCount());
            }
        }

        int existingCount = 0;
        List<QuestionBankCreateRequest> allQuestions = new ArrayList<>();
        for (QuestionBankItem item : existingQuestions) {
            QuestionBankCreateRequest req = toRequest(item);
            if (req != null) {
                allQuestions.add(req);
                existingCount++;
            }
        }
        int remainingCount = message.getCount() - existingCount;
        log.info("Found {} existing questions. Need to generate {} more.", existingCount, remainingCount);

        // Strategy 2: Chunking & Parallel Generation
        if (remainingCount > 0) {
            int chunkSize = 5;
            List<CompletableFuture<List<QuestionBankCreateRequest>>> futures = new ArrayList<>();

            while (remainingCount > 0) {
                int generateCount = Math.min(remainingCount, chunkSize);
                remainingCount -= generateCount;

                CompletableFuture<List<QuestionBankCreateRequest>> future = CompletableFuture.supplyAsync(() -> {
                    QuestionBankListResponse response = questionGeneratorAgent.generateQuestions(
                            message.getSubject(),
                            message.getGradeLevel(),
                            message.getTopic(),
                            message.getDifficulty(),
                            generateCount
                    );
                    return response.getQuestions();
                }).exceptionally(ex -> {
                    log.error("Failed to generate a chunk of questions", ex);
                    return new ArrayList<>(); // return empty to continue others
                });

                futures.add(future);
            }

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

            for (CompletableFuture<List<QuestionBankCreateRequest>> future : futures) {
                allQuestions.addAll(future.join());
            }
        }

        if (allQuestions.size() != message.getCount()) throw new IllegalStateException("Incomplete generated quiz");
        return allQuestions;
    }

    private QuizQuestion toQuizQuestion(QuestionBankCreateRequest q, QuizGenerationMessage message) {
        QuizQuestion qq = new QuizQuestion();
        qq.setQuestionText(q.getStem());
        qq.setType(q.getType() != null ? q.getType() : QuestionType.MULTIPLE_CHOICE);
        qq.setExplanation(q.getExplanation());
        qq.setTopic(message.getTopic());
        qq.setPoints(1);

        List<Map<String, Object>> options = new ArrayList<>();
        String correctKey = null;

        List<String> choices = q.getChoices();
        if (choices != null && !choices.isEmpty()) {
            for (int i = 0; i < choices.size(); i++) {
                char keyChar = (char) ('A' + i);
                String key = String.valueOf(keyChar);

                Map<String, Object> optMap = new HashMap<>();
                optMap.put("key", key);
                optMap.put("content", choices.get(i));
                options.add(optMap);

                if (choices.get(i).equals(q.getCorrectAnswer())) {
                    correctKey = key;
                }
            }
        } else {
            correctKey = q.getCorrectAnswer();
        }
        qq.setOptions(options);
        qq.setCorrectOptionKey(correctKey);

        if (!QuizAccessService.validQuestion(qq))
            throw new IllegalArgumentException("Generated question has invalid answer or explanation");
        return qq;
    }

    private QuestionBankCreateRequest toRequest(QuestionBankItem item) {
        if (item.getQuestionType() == QuestionType.MULTI_SELECT
                || item.getStem() == null || item.getStem().isBlank()
                || item.getExplanation() == null || item.getExplanation().isBlank()) {
            return null;
        }
        List<String> choices = new ArrayList<>();
        String correct = item.getCorrectText();
        if (item.getChoices() != null) {
            for (QuestionChoice choice : item.getChoices()) {
                if (choice.getChoiceText() == null || choice.getChoiceText().isBlank()) {
                    continue;
                }
                choices.add(choice.getChoiceText());
                if (choice.isCorrect()) {
                    correct = choice.getChoiceText();
                }
            }
        }
        if (correct == null || correct.isBlank()) {
            return null;
        }
        QuestionBankCreateRequest request = new QuestionBankCreateRequest();
        request.setStem(item.getStem());
        request.setType(item.getQuestionType());
        request.setExplanation(item.getExplanation());
        request.setChoices(choices);
        request.setCorrectAnswer(correct);
        return request;
    }
}
