package com.vn.aitutor.service.impl;

import com.vn.aitutor.entity.DocumentChunk;
import com.vn.aitutor.repository.DocumentChunkRepository;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.query.Query;
import dev.langchain4j.data.document.Metadata;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.vn.aitutor.context.RagContextHolder;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomPostgresRetriever implements ContentRetriever {

    private final DocumentChunkRepository documentChunkRepository;
    private final EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();

    @Override
    public List<Content> retrieve(Query query) {
        log.info("RAG Query: {}", query.text());
        
        // 1. Embed the query to 384 dimensions
        float[] queryVector = embeddingModel.embed(query.text()).content().vector();
        
        // 2. Convert float[] to Postgres vector string format: "[0.1, 0.2, ...]"
        String vectorString = Arrays.toString(queryVector);

        // 3. Search database for top 5 most similar chunks (with optional filters)
        RagContextHolder.RagContext context = RagContextHolder.getContext();
        List<DocumentChunk> topChunks;
        
        if (context != null && (context.getSubject() != null || context.getGradeLevel() != null)) {
            log.info("RAG Filtering - Subject: {}, Grade: {}", context.getSubject(), context.getGradeLevel());
            topChunks = documentChunkRepository.findTopSimilarChunksWithFilter(
                    vectorString, context.getSubject(), context.getGradeLevel(), 5);
        } else {
            topChunks = documentChunkRepository.findTopSimilarChunks(vectorString, 5);
        }

        // 4. Convert entities to LangChain4j Content objects
        return topChunks.stream()
                .map(chunk -> {
                    // Create TextSegment with metadata
                    Metadata metadata = new Metadata();
                    if (chunk.getMetadata() != null) {
                        chunk.getMetadata().forEach((k, v) -> metadata.put(k, String.valueOf(v)));
                    }
                    TextSegment segment = TextSegment.from(chunk.getContent(), metadata);
                    return Content.from(segment);
                })
                .collect(Collectors.toList());
    }
}
