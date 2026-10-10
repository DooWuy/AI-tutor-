package com.vn.aitutor.listener;

import com.vn.aitutor.config.RabbitMQConfig;
import com.vn.aitutor.dto.message.BookExtractionMessage;
import com.vn.aitutor.service.BookExtractionService;
import com.vn.aitutor.service.ICloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookExtractionListener {

    private final BookExtractionService bookExtractionService;
    private final ICloudinaryService cloudinaryService;

    @RabbitListener(queues = RabbitMQConfig.CURRICULUM_EXTRACTION_QUEUE)
    public void onMessage(BookExtractionMessage message) {
        try {
            bookExtractionService.run(message);
        } finally {
            cloudinaryService.deleteStoredFile(message.getSourcePath());
        }
    }
}

