package com.vn.aitutor.curriculum;

import com.vn.aitutor.exception.ResourceBadRequestException;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import org.apache.pdfbox.pdmodel.PDDocument;

public final class PdfSplitterUtil {

    private PdfSplitterUtil() {
    }

    public static int pageCount(byte[] pdf) {
        try (PDDocument document = PDDocument.load(pdf)) {
            return document.getNumberOfPages();
        } catch (IOException ex) {
            throw new ResourceBadRequestException("Không đọc được file PDF");
        }
    }

    public static byte[] split(File source, int startPage, int endPage) {
        try (PDDocument document = PDDocument.load(source)) {
            return split(document, startPage, endPage);
        } catch (ResourceBadRequestException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new ResourceBadRequestException("Không đọc được file PDF");
        }
    }

    public static byte[] split(byte[] pdf, int startPage, int endPage) {
        try (PDDocument document = PDDocument.load(pdf)) {
            return split(document, startPage, endPage);
        } catch (ResourceBadRequestException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new ResourceBadRequestException("Không đọc được file PDF");
        }
    }

    private static byte[] split(PDDocument document, int startPage, int endPage) throws IOException {
        if (startPage < 1 || endPage < startPage) {
            throw new ResourceBadRequestException("Khoảng trang không hợp lệ");
        }
        int pages = document.getNumberOfPages();
        if (endPage > pages) {
            throw new ResourceBadRequestException("Khoảng trang vượt quá số trang của sách (" + pages + ")");
        }
        try (PDDocument part = new PDDocument()) {
            for (int page = startPage; page <= endPage; page++) {
                part.importPage(document.getPage(page - 1));
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            part.save(out);
            return out.toByteArray();
        }
    }
}
