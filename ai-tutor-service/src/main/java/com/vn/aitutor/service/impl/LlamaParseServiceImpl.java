package com.vn.aitutor.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.util.Map;

import com.vn.aitutor.service.ILlamaParseService;

@Service
@RequiredArgsConstructor
@Slf4j
public class LlamaParseServiceImpl implements ILlamaParseService {

    @Value("${llamaparse.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String LLAMA_CLOUD_BASE_URL = "https://api.cloud.llamaindex.ai/api/parsing";

    @Override
    public String parsePdfToMarkdown(File pdfFile) throws Exception {
        return parseFileToMarkdown(pdfFile, "Giữ nguyên mọi công thức dưới dạng LaTeX ($...$ hoặc $$...$$).");
    }

    @Override
    public String parseFileToMarkdown(File pdfFile, String parsingInstruction) throws Exception {
        log.info("Bắt đầu đẩy file {} lên LlamaParse...", pdfFile.getName());

        // 1. Upload File
        HttpHeaders uploadHeaders = new HttpHeaders();
        uploadHeaders.setContentType(MediaType.MULTIPART_FORM_DATA);
        uploadHeaders.setBearerAuth(apiKey);
        uploadHeaders.set("accept", "application/json");

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(pdfFile));
        if (parsingInstruction != null && !parsingInstruction.isBlank()) {
            body.add("parsing_instruction", parsingInstruction);
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, uploadHeaders);

        ResponseEntity<Map> uploadResponse = restTemplate.postForEntity(
                LLAMA_CLOUD_BASE_URL + "/upload",
                requestEntity,
                Map.class
        );

        if (uploadResponse.getStatusCode() != HttpStatus.OK || uploadResponse.getBody() == null) {
            throw new RuntimeException("Failed to upload file to LlamaParse: " + uploadResponse.getStatusCode());
        }

        String jobId = (String) uploadResponse.getBody().get("id");
        log.info("Đã nhận Job ID từ LlamaParse: {}", jobId);

        // 2. Poll for status
        HttpHeaders pollHeaders = new HttpHeaders();
        pollHeaders.setBearerAuth(apiKey);
        pollHeaders.set("accept", "application/json");
        HttpEntity<Void> pollEntity = new HttpEntity<>(pollHeaders);

        String status = "PENDING";
        while (!"SUCCESS".equals(status) && !"ERROR".equals(status)) {
            Thread.sleep(3000); // Wait 3 seconds
            ResponseEntity<Map> statusResponse = restTemplate.exchange(
                    LLAMA_CLOUD_BASE_URL + "/job/" + jobId,
                    HttpMethod.GET,
                    pollEntity,
                    Map.class
            );
            
            if (statusResponse.getStatusCode() == HttpStatus.OK && statusResponse.getBody() != null) {
                status = (String) statusResponse.getBody().get("status");
                log.info("Trạng thái LlamaParse Job [{}]: {}", jobId, status);
            } else {
                throw new RuntimeException("Failed to get job status");
            }
        }

        if ("ERROR".equals(status)) {
            throw new RuntimeException("LlamaParse returned ERROR status for job: " + jobId);
        }

        // 3. Get Markdown Result
        log.info("LlamaParse hoàn tất, đang tải kết quả Markdown về...");
        ResponseEntity<Map> resultResponse = restTemplate.exchange(
                LLAMA_CLOUD_BASE_URL + "/job/" + jobId + "/result/markdown",
                HttpMethod.GET,
                pollEntity,
                Map.class
        );

        if (resultResponse.getStatusCode() == HttpStatus.OK && resultResponse.getBody() != null) {
            return (String) resultResponse.getBody().get("markdown");
        }

        throw new RuntimeException("Failed to retrieve markdown result from LlamaParse");
    }
}
