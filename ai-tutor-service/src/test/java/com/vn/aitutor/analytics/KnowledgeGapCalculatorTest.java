package com.vn.aitutor.analytics;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class KnowledgeGapCalculatorTest {

    @Test
    void ac02_coneVolumeIsFirstAtSeventyFivePercent() {
        List<UUID> students = ids(40);
        List<StudentTopicCount> counts = new ArrayList<>();
        for (int i = 0; i < 40; i++) {
            if (i < 30) {
                counts.add(new StudentTopicCount("Thể tích hình nón", "TOAN", students.get(i), 2, 0));
            } else {
                counts.add(new StudentTopicCount("Thể tích hình nón", "TOAN", students.get(i), 0, 2));
            }
            if (i < 4) {
                counts.add(new StudentTopicCount("Tiệm cận", "TOAN", students.get(i), 2, 0));
            }
        }

        List<RankedGap> ranked = KnowledgeGapCalculator.rank(40, counts);

        assertEquals(2, ranked.size());
        RankedGap first = ranked.get(0);
        assertEquals("Thể tích hình nón", first.topic());
        assertEquals(30, first.affectedStudentCount());
        assertEquals(60, first.wrongAnswerCount());
        assertEquals(0, first.affectedPercent().compareTo(new BigDecimal("75.0")));
        assertEquals("75.0", first.affectedPercent().toPlainString());
        assertEquals("Tiệm cận", ranked.get(1).topic());
        assertEquals(0, ranked.get(1).affectedPercent().compareTo(new BigDecimal("10.0")));
    }

    @Test
    void studentWhoAnsweredCorrectlyMoreOftenIsNotAffected() {
        UUID student = UUID.randomUUID();
        List<RankedGap> ranked = KnowledgeGapCalculator.rank(
                40, List.of(new StudentTopicCount("Thể tích hình nón", "TOAN", student, 1, 2)));
        assertTrue(ranked.isEmpty());
    }

    @Test
    void emptyClassReturnsNoGaps() {
        UUID student = UUID.randomUUID();
        assertTrue(KnowledgeGapCalculator.rank(
                        0, List.of(new StudentTopicCount("Thể tích hình nón", "TOAN", student, 2, 0)))
                .isEmpty());
    }

    @Test
    void oneOfThreeIsThirtyThreePointThree() {
        assertEquals(0, KnowledgeGapCalculator.affectedPercent(1, 3).compareTo(new BigDecimal("33.3")));
        assertEquals("75", KnowledgeGapCalculator.formatPercent(new BigDecimal("75.0")));
        assertEquals("33.3", KnowledgeGapCalculator.formatPercent(new BigDecimal("33.3")));
    }

    private static List<UUID> ids(int count) {
        List<UUID> ids = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            ids.add(UUID.randomUUID());
        }
        return ids;
    }
}
