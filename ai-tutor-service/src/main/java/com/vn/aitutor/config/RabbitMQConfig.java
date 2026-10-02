package com.vn.aitutor.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String DOCUMENT_EXCHANGE = "document.exchange";
    public static final String DOCUMENT_INGESTION_QUEUE = "document.ingestion.queue";
    public static final String DOCUMENT_INGESTION_ROUTING_KEY = "document.ingestion.routing.key";
    public static final String CURRICULUM_EXTRACTION_QUEUE = "curriculum.extraction.queue";
    public static final String CURRICULUM_EXTRACTION_ROUTING_KEY = "curriculum.extraction.routing.key";

    @Bean
    public Queue documentIngestionQueue() {
        return new Queue(DOCUMENT_INGESTION_QUEUE, true);
    }

    @Bean
    public DirectExchange documentExchange() {
        return new DirectExchange(DOCUMENT_EXCHANGE);
    }

    @Bean
    public Binding bindingDocumentIngestion(Queue documentIngestionQueue, DirectExchange documentExchange) {
        return BindingBuilder.bind(documentIngestionQueue).to(documentExchange).with(DOCUMENT_INGESTION_ROUTING_KEY);
    }

    @Bean
    public Queue curriculumExtractionQueue() {
        return new Queue(CURRICULUM_EXTRACTION_QUEUE, true);
    }

    @Bean
    public Binding bindingCurriculumExtraction(Queue curriculumExtractionQueue, DirectExchange documentExchange) {
        return BindingBuilder.bind(curriculumExtractionQueue)
                .to(documentExchange)
                .with(CURRICULUM_EXTRACTION_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
