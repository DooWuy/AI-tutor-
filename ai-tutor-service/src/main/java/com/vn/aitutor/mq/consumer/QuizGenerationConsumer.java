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

    @RabbitListener(queues = RabbitMQConfig.QUIZ_GENERATION_QUEUE)
    public void handleQuizGeneration(QuizGenerationMessage message) {
        log.info("Received quiz generation request for quizId: {}", message.getQuizId());
        try {
            Quiz quiz = quizRepository.findById(message.getQuizId()).orElseThrow();
            
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
                        log.error("Failed to generate a chunk of questions: {}", ex.getMessage());
                        return new ArrayList<>(); // return empty to continue others
                    });
                    
                    futures.add(future);
                }
                
                CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                
                for (CompletableFuture<List<QuestionBankCreateRequest>> future : futures) {
                    allQuestions.addAll(future.join());
                }
            }

            // Save all questions to QuizQuestion
            int orderIndex = 1;
            for (QuestionBankCreateRequest q : allQuestions) {
                QuizQuestion qq = new QuizQuestion();
                qq.setQuiz(quiz);
                qq.setQuestionText(q.getStem());
                qq.setType(q.getType() != null ? q.getType() : QuestionType.MULTIPLE_CHOICE);
                qq.setExplanation(q.getExplanation());
                qq.setOrderIndex(orderIndex++);
                qq.setTopic(message.getTopic());
                qq.setPoints(1);

                List<Map<String, Object>> options = new ArrayList<>();
                String correctKey = "A";
                
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

                quizQuestionRepository.save(qq);
            }

            // Update quiz status to PENDING
            quiz.setActive(true); // Assuming active true means ready
            quizRepository.save(quiz);

            // Send WebSocket notification
            log.info("Quiz generation completed. Sending WS notification.");
            Map<String, Object> wsMessage = new HashMap<>();
            wsMessage.put("type", "QUIZ_GENERATED");
            wsMessage.put("quizId", quiz.getId());
            messagingTemplate.convertAndSendToUser(quiz.getCreatedBy().getUsername(), "/queue/notifications", (Object) wsMessage);

        } catch (Exception e) {
            log.error("Error generating quiz", e);
        }
    }
}
