package com.vn.aitutor.context;

import lombok.Data;

public class RagContextHolder {

    private static final ThreadLocal<RagContext> CONTEXT = new ThreadLocal<>();

    public static void setContext(String subject, String gradeLevel) {
        RagContext context = new RagContext();
        context.setSubject(subject);
        context.setGradeLevel(gradeLevel);
        CONTEXT.set(context);
    }

    public static RagContext getContext() {
        return CONTEXT.get();
    }

    public static void clearContext() {
        CONTEXT.remove();
    }

    @Data
    public static class RagContext {
        private String subject;
        private String gradeLevel;
    }
}
