package com.vn.aitutor.service;

import java.io.File;

public interface ILlamaParseService {
    /**
     * Tải file PDF lên LlamaParse và chờ xử lý để lấy nội dung Markdown.
     * @param pdfFile file PDF vật lý
     * @return Chuỗi văn bản Markdown chứa nội dung (bao gồm cả công thức Toán)
     * @throws Exception nếu có lỗi trong quá trình giao tiếp với API
     */
    String parsePdfToMarkdown(File pdfFile) throws Exception;
}
