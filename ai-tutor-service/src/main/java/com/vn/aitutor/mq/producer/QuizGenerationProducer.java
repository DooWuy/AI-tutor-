package com.vn.aitutor.mq.producer;

import com.vn.aitutor.config.RabbitMQConfig;
import com.vn.aitutor.dto.request.QuizGenerationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizGenerationProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendQuizGenerationRequest(QuizGenerationMessage message) {
        log.info("Sending quiz generation request for quizId: {}", message.getQuizId());
        rabbitTemplate.convertAndSend(RabbitMQConfig.DOCUMENT_EXCHANGE, RabbitMQConfig.QUIZ_GENERATION_ROUTING_KEY, message);
    }
}
