package com.vn.aitutor.exception;

public class StudentClassRequiredException extends ResourceBadRequestException {
    public StudentClassRequiredException() {
        super("Bạn chưa được xếp lớp để xem bảng xếp hạng lớp");
    }
}
