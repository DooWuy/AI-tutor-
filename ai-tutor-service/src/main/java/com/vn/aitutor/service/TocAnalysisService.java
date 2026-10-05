package com.vn.aitutor.service;

import com.vn.aitutor.curriculum.CurriculumCodes;
import com.vn.aitutor.curriculum.LessonPageRangePlanner;
import com.vn.aitutor.curriculum.PdfSplitterUtil;
import com.vn.aitutor.curriculum.PrintedPageOffsetDetector;
import com.vn.aitutor.curriculum.TocDrafts.TocChapterDraft;
import com.vn.aitutor.curriculum.TocDrafts.TocLessonDraft;
import com.vn.aitutor.curriculum.TocJsonParser;
import com.vn.aitutor.dto.response.TocAnalysisResponse;
import com.vn.aitutor.entity.Book;
import com.vn.aitutor.entity.enums.TocExtractionMethod;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ServiceUnavailableException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.OptionalInt;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Service
@RequiredArgsConstructor
public class TocAnalysisService {

    private static final String PROMPT = """
            Bạn đọc các ảnh mục lục sách giáo khoa tiếng Việt.
            Chỉ trả về JSON mảng, không markdown, theo dạng:
            [{"chapterName":"Chương 1","lessons":[{"lessonName":"Bài 1","startPage":6}]}]
            startPage và endPage là số trang in trên mục lục.
            Nếu một dòng chỉ có một số trang, điền startPage và bỏ endPage.
            Giữ dòng phụ lục, ví dụ "Một số thuật ngữ dùng trong sách", như một lesson riêng.
            """;

    private final CurriculumService curriculumService;
    private final LearningMaterialValidator learningMaterialValidator;
    private final ILlamaParseService llamaParseService;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent}")
    private String geminiApiUrl;

    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private final RestTemplate restTemplate = restTemplate();

    @Transactional
    public TocAnalysisResponse analyze(
            java.util.UUID bookId,
            MultipartFile file,
            List<MultipartFile> tocImages,
            TocExtractionMethod method,
            String curriculumName) {
        Book book = curriculumService.requireBook(bookId);
        learningMaterialValidator.validateTextbook(file);
        if (tocImages == null || tocImages.isEmpty()) {
            throw new ResourceBadRequestException("Cần ít nhất một ảnh mục lục");
        }
        tocImages.forEach(learningMaterialValidator::validateTocImage);
        if (curriculumName != null && !curriculumName.isBlank()) {
            book.setCurriculumName(CurriculumCodes.requireText(curriculumName, "Chương trình học", 2, 50));
        }
        try {
            byte[] pdf = file.getBytes();
            int pageCount = PdfSplitterUtil.pageCount(pdf);
            String raw = method == TocExtractionMethod.OCR ? readWithOcr(tocImages) : readWithGemini(tocImages);
            List<TocChapterDraft> planned = LessonPageRangePlanner.plan(TocJsonParser.parse(raw));
            OptionalInt offset = PrintedPageOffsetDetector.detect(pdf);
            return TocAnalysisResponse.builder()
                    .pdfPageCount(pageCount)
                    .pdfPageOffset(offset.isPresent() ? offset.getAsInt() : null)
                    .chapters(planned.stream().map(this::toChapter).toList())
                    .build();
        } catch (ServiceUnavailableException | ResourceBadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to analyze TOC: {}", ex.getMessage(), ex);
            throw new ServiceUnavailableException("Không phân tích được mục lục", ex);
        }
    }

    private String readWithGemini(List<MultipartFile> images) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new ServiceUnavailableException("Chưa cấu hình Gemini API key");
        }
        try {
            List<Map<String, Object>> parts = new ArrayList<>();
            parts.add(Map.of("text", PROMPT));
            for (MultipartFile image : images) {
                parts.add(Map.of(
                        "inline_data",
                        Map.of(
                                "mime_type", imageMime(image),
                                "data", Base64.getEncoder().encodeToString(image.getBytes()))));
            }
            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", parts)),
                    "generationConfig", Map.of("temperature", 0.1));
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            List<String> candidateUrls = new ArrayList<>();
            if (geminiApiUrl != null && !geminiApiUrl.isBlank()) {
                candidateUrls.add(geminiApiUrl);
            }
            List<String> fallbackModels = List.of(
                    "gemini-flash-lite-latest",
                    "gemini-3.5-flash-lite",
                    "gemini-3.1-flash-lite",
                    "gemini-3.8-flash",
                    "gemini-3.5-flash"
            );
            for (String model : fallbackModels) {
                String candidate = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
                if (!candidateUrls.contains(candidate)) {
                    candidateUrls.add(candidate);
                }
            }

            Exception lastException = null;
            for (String candidateUrl : candidateUrls) {
                try {
                    String url = candidateUrl + "?key=" + java.net.URLEncoder.encode(geminiApiKey, java.nio.charset.StandardCharsets.UTF_8);
                    log.info("Attempting TOC analysis using Gemini model: {}", candidateUrl);
                    ResponseEntity<String> response = restTemplate.exchange(
                            url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
                    String result = extractText(response.getBody());
                    log.info("Successfully analyzed TOC with Gemini model: {}", candidateUrl);
                    return result;
                } catch (Exception ex) {
                    log.warn("Gemini model {} failed: {}. Trying fallback...", candidateUrl, ex.getMessage());
                    lastException = ex;
                }
            }

            log.error("All Gemini candidate models failed to analyze TOC", lastException);
            throw new ServiceUnavailableException("Không phân tích được mục lục", lastException);
        } catch (ServiceUnavailableException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Gemini analysis error: {}", ex.getMessage(), ex);
            throw new ServiceUnavailableException("Không phân tích được mục lục", ex);
        }
    }

    private String readWithOcr(List<MultipartFile> images) {
        List<String> pieces = new ArrayList<>();
        for (MultipartFile image : images) {
            java.io.File temp = null;
            try {
                String ext = image.getOriginalFilename() != null && image.getOriginalFilename().toLowerCase(Locale.ROOT).endsWith(".png")
                        ? ".png" : ".jpg";
                temp = java.io.File.createTempFile("toc-", ext);
                image.transferTo(temp);
                pieces.add(llamaParseService.parseFileToMarkdown(temp, PROMPT));
            } catch (Exception ex) {
                throw new ServiceUnavailableException("Không phân tích được mục lục", ex);
            } finally {
                if (temp != null && !temp.delete()) {
                    temp.deleteOnExit();
                }
            }
        }
        return pieces.size() == 1 ? pieces.get(0) : mergeRaw(pieces);
    }

    private String mergeRaw(List<String> pieces) {
        List<TocChapterDraft> merged = TocJsonParser.parseAll(pieces);
        try {
            return jsonMapper.writeValueAsString(merged.stream().map(chapter -> Map.of(
                    "chapterName", chapter.chapterName() == null ? "" : chapter.chapterName(),
                    "lessons", chapter.lessons().stream().map(lesson -> {
                        Map<String, Object> row = new java.util.LinkedHashMap<>();
                        row.put("lessonName", lesson.lessonName());
                        row.put("startPage", lesson.startPage());
                        row.put("endPage", lesson.endPage());
                        return row;
                    }).toList())).toList());
        } catch (RuntimeException ex) {
            throw new ServiceUnavailableException("Không phân tích được mục lục", ex);
        }
    }

    private String extractText(String body) {
        if (body == null || body.isBlank()) {
            throw new ServiceUnavailableException("Không phân tích được mục lục");
        }
        JsonNode root = jsonMapper.readTree(body);
        JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            throw new ServiceUnavailableException("Không phân tích được mục lục");
        }
        String text = parts.get(0).path("text").asString();
        if (text == null || text.isBlank()) {
            throw new ServiceUnavailableException("Không phân tích được mục lục");
        }
        return text;
    }

    private TocAnalysisResponse.Chapter toChapter(TocChapterDraft chapter) {
        return TocAnalysisResponse.Chapter.builder()
                .chapterName(chapter.chapterName())
                .appendix(chapter.appendix())
                .lessons(chapter.lessons().stream().map(this::toLesson).toList())
                .build();
    }

    private TocAnalysisResponse.Lesson toLesson(TocLessonDraft lesson) {
        return TocAnalysisResponse.Lesson.builder()
                .lessonName(lesson.lessonName())
                .startPage(lesson.startPage())
                .endPage(lesson.endPage())
                .appendix(lesson.appendix())
                .warning(lesson.warning())
                .build();
    }

    private String imageMime(MultipartFile image) {
        String name = image.getOriginalFilename() == null ? "" : image.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (name.endsWith(".png")) {
            return "image/png";
        }
        if (name.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private static RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(60000);
        return new RestTemplate(factory);
    }
}
