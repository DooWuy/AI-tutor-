package com.vn.aitutor.notification;

import com.vn.aitutor.entity.enums.SubjectCode;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

public final class SubjectNames {

    private static final Map<String, SubjectCode> ALIASES = Map.ofEntries(
            Map.entry("toan", SubjectCode.TOAN),
            Map.entry("toan hoc", SubjectCode.TOAN),
            Map.entry("vat ly", SubjectCode.LY),
            Map.entry("ly", SubjectCode.LY),
            Map.entry("vatli", SubjectCode.LY),
            Map.entry("hoa", SubjectCode.HOA),
            Map.entry("hoa hoc", SubjectCode.HOA),
            Map.entry("sinh", SubjectCode.SINH),
            Map.entry("sinh hoc", SubjectCode.SINH),
            Map.entry("anh", SubjectCode.ANH),
            Map.entry("tieng anh", SubjectCode.ANH),
            Map.entry("english", SubjectCode.ANH),
            Map.entry("van", SubjectCode.VAN),
            Map.entry("ngu van", SubjectCode.VAN),
            Map.entry("su", SubjectCode.SU),
            Map.entry("lich su", SubjectCode.SU),
            Map.entry("dia", SubjectCode.DIA),
            Map.entry("dia ly", SubjectCode.DIA),
            Map.entry("gdcd", SubjectCode.GDCD),
            Map.entry("giao duc cong dan", SubjectCode.GDCD),
            Map.entry("giao duc kinh te va phap luat", SubjectCode.GDCD),
            Map.entry("tin", SubjectCode.TIN),
            Map.entry("tin hoc", SubjectCode.TIN)
    );

    private SubjectNames() {
    }

    public static Optional<SubjectCode> match(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String folded = fold(raw);
        SubjectCode exact = ALIASES.get(folded);
        if (exact != null) {
            return Optional.of(exact);
        }
        return ALIASES.entrySet().stream()
                .filter(entry -> containsPhrase(folded, entry.getKey()))
                .max(Comparator.comparingInt(entry -> entry.getKey().length()))
                .map(Map.Entry::getValue);
    }

    static String fold(String raw) {
        String simplified = raw.trim().replace('Đ', 'đ').replace('đ', 'd').toLowerCase(Locale.ROOT);
        String decomposed = Normalizer.normalize(simplified, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return decomposed.replaceAll("[^a-z0-9]+", " ").trim().replaceAll("\\s+", " ");
    }

    private static boolean containsPhrase(String folded, String alias) {
        return folded.equals(alias)
                || folded.startsWith(alias + " ")
                || folded.endsWith(" " + alias)
                || folded.contains(" " + alias + " ");
    }
}
