package com.vn.aitutor.mq.consumer;

import com.vn.aitutor.agent.QuestionGeneratorAgent;
import com.vn.aitutor.config.RabbitMQConfig;
import com.vn.aitutor.dto.request.QuestionBankCreateRequest;
import com.vn.aitutor.dto.request.QuizGenerationMessage;
import com.vn.aitutor.dto.response.QuestionBankListResponse;
import com.vn.aitutor.entity.QuestionBank;
import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.QuizQuestion;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizGenerationConsumer {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuestionBankRepository questionBankRepository;
    private final QuestionGeneratorAgent questionGeneratorAgent;
    private final SimpMessagingTemplate messagingTemplate;
    private final org.springframework.transaction.support.TransactionTemplate transactions;

    @RabbitListener(queues = RabbitMQConfig.QUIZ_GENERATION_QUEUE)
    public void handleQuizGeneration(QuizGenerationMessage message) {
        log.info("Received quiz generation request for quizId: {}", message.getQuizId());
        try {
            Quiz quiz = quizRepository.findById(message.getQuizId()).orElseThrow();
            if ("READY".equals(quiz.getGenerationStatus())) return;
            
            // Strategy 1: Find existing questions in QuestionBank (fallback)
            List<QuestionBank> existingQuestions = questionBankRepository.findRandomByTopicAndDifficulty(
                    message.getTopic(), message.getDifficulty(), message.getCount());
            
            int existingCount = existingQuestions.size();
            int remainingCount = message.getCount() - existingCount;
            log.info("Found {} existing questions. Need to generate {} more.", existingCount, remainingCount);

            List<QuestionBankCreateRequest> allQuestions = new ArrayList<>();

            // Map existing to the request DTO format
            for (QuestionBank qb : existingQuestions) {
                QuestionBankCreateRequest req = new QuestionBankCreateRequest();
                req.setStem(qb.getStem());
                req.setType(qb.getType());
                req.setExplanation(qb.getExplanation());
                req.setCorrectAnswer(qb.getCorrectAnswer());
                req.setChoices(qb.getChoices());
                allQuestions.add(req);
            }

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
            String recipient = transactions.execute(tx -> {
            Quiz lockedQuiz = quizRepository.lockById(quiz.getId()).orElseThrow();
            if ("READY".equals(lockedQuiz.getGenerationStatus())) return null;
            // Save questions and publish readiness atomically.
            int orderIndex = 1;
            for (QuestionBankCreateRequest q : allQuestions) {
                QuizQuestion qq = new QuizQuestion();
                qq.setQuiz(lockedQuiz);
                qq.setQuestionText(q.getStem());
                qq.setType(q.getType() != null ? q.getType() : QuestionType.MULTIPLE_CHOICE);
                qq.setExplanation(q.getExplanation());
                qq.setOrderIndex(orderIndex++);
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

                if (!com.vn.aitutor.service.QuizAccessService.validQuestion(qq))
                    throw new IllegalArgumentException("Generated question has invalid answer or explanation");

                quizQuestionRepository.save(qq);
            }

            // Update quiz status to PENDING
            lockedQuiz.setActive(true);
            lockedQuiz.setGenerationStatus("READY");
            quizRepository.save(lockedQuiz);
            return lockedQuiz.getCreatedBy().getUsername();
            });

            // Send WebSocket notification
            log.info("Quiz generation completed. Sending WS notification.");
            Map<String, Object> wsMessage = new HashMap<>();
            wsMessage.put("type", "QUIZ_GENERATED");
            wsMessage.put("quizId", quiz.getId());
            if (recipient != null) {
                try { messagingTemplate.convertAndSendToUser(recipient, "/queue/notifications", (Object) wsMessage); }
                catch (Exception notificationError) { log.warn("Quiz ready but notification failed for {}", quiz.getId(), notificationError); }
            }

        } catch (Exception e) {
            log.error("Error generating quiz", e);
            quizRepository.findById(message.getQuizId()).ifPresent(q -> {
                if (!"READY".equals(q.getGenerationStatus())) { q.setGenerationStatus("FAILED"); quizRepository.save(q); }
            });
        }
    }
}
