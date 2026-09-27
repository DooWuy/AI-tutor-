package com.vn.aitutor.dto.request;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.vn.aitutor.entity.enums.Gender;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.Getter;

/** Allowlisted, presence-aware PATCH payload for the current student. */
@Getter
public class StudentProfileUpdateRequest {
    private String fullName;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String phoneNumber;
    private String gradeLevel;
    private String className;
    private Map<String, Object> studyPreferences;
    private final Map<String, Object> unsupportedFields = new LinkedHashMap<>();
    private final Map<String, Boolean> suppliedFields = new HashMap<>();

    public void setFullName(String value) { fullName = value; suppliedFields.put("fullName", true); }
    public void setDateOfBirth(LocalDate value) { dateOfBirth = value; suppliedFields.put("dateOfBirth", true); }
    public void setGender(Gender value) { gender = value; suppliedFields.put("gender", true); }
    public void setPhoneNumber(String value) { phoneNumber = value; suppliedFields.put("phoneNumber", true); }
    public void setGradeLevel(String value) { gradeLevel = value; suppliedFields.put("gradeLevel", true); }
    public void setClassName(String value) { className = value; suppliedFields.put("className", true); }
    public void setStudyPreferences(Map<String, Object> value) {
        studyPreferences = value;
        suppliedFields.put("studyPreferences", true);
    }

    @JsonAnySetter
    public void captureUnsupportedField(String name, Object value) {
        unsupportedFields.put(name, value);
    }

    public boolean isSupplied(String name) {
        return suppliedFields.containsKey(name);
    }
}
