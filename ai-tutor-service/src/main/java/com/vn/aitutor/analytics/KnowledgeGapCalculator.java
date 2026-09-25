package com.vn.aitutor.analytics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Ranks class knowledge gaps from per-student wrong/correct counts.
 * Percent and order are deterministic. The model never supplies them.
 */
public final class KnowledgeGapCalculator {

    private KnowledgeGapCalculator() {}

    public static BigDecimal affectedPercent(int affectedStudents, int classSize) {
        if (classSize <= 0 || affectedStudents <= 0) {
            return BigDecimal.ZERO.setScale(1, RoundingMode.UNNECESSARY);
        }
        return BigDecimal.valueOf(affectedStudents)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(classSize), 1, RoundingMode.HALF_UP);
    }

    /**
     * Whole numbers stay plain ("75"), one decimal stays ("33.3"). No scientific notation.
     */
    public static String formatPercent(BigDecimal percent) {
        if (percent == null) {
            return "0";
        }
        BigDecimal scaled = percent.setScale(1, RoundingMode.HALF_UP);
        if (scaled.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0) {
            return scaled.setScale(0, RoundingMode.UNNECESSARY).toPlainString();
        }
        return scaled.toPlainString();
    }

    public static List<RankedGap> rank(int classSize, List<StudentTopicCount> counts) {
        if (classSize <= 0 || counts == null || counts.isEmpty()) {
            return List.of();
        }
        Map<String, Mutable> byTopic = new LinkedHashMap<>();
        for (StudentTopicCount count : counts) {
            if (count.topic() == null || count.topic().isBlank() || count.studentId() == null) {
                continue;
            }
            String subject = count.subject() == null ? "" : count.subject();
            String key = subject + "\n" + count.topic().trim();
            Mutable bucket = byTopic.computeIfAbsent(key, ignored -> new Mutable(count.topic().trim(), subject));
            StudentTally tally = bucket.students.computeIfAbsent(count.studentId(), ignored -> new StudentTally());
            tally.wrong += Math.max(0, count.wrongCount());
            tally.correct += Math.max(0, count.correctCount());
        }

        List<RankedGap> ranked = new ArrayList<>();
        for (Mutable bucket : byTopic.values()) {
            int affected = 0;
            long wrong = 0;
            long correct = 0;
            for (StudentTally tally : bucket.students.values()) {
                wrong += tally.wrong;
                correct += tally.correct;
                if (tally.wrong > tally.correct) {
                    affected++;
                }
            }
            if (affected == 0) {
                continue;
            }
            ranked.add(new RankedGap(
                    bucket.topic,
                    bucket.subject,
                    affected,
                    affectedPercent(affected, classSize),
                    wrong,
                    correct));
        }
        ranked.sort(Comparator.comparing(RankedGap::affectedPercent)
                .reversed()
                .thenComparing(Comparator.comparingLong(RankedGap::wrongAnswerCount).reversed())
                .thenComparing(RankedGap::topic)
                .thenComparing(RankedGap::subject));
        return List.copyOf(ranked);
    }

    private static final class Mutable {
        private final String topic;
        private final String subject;
        private final Map<UUID, StudentTally> students = new LinkedHashMap<>();

        private Mutable(String topic, String subject) {
            this.topic = topic;
            this.subject = subject;
        }
    }

    private static final class StudentTally {
        private long wrong;
        private long correct;
    }
}
