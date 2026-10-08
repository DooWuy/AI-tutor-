package com.vn.aitutor.service;

import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class QuizAccess {

    private final QuizRepository quizRepository;

    public Quiz require(UUID quizId, UserPrincipal principal) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));
        assertCanManage(principal, quiz);
        return quiz;
    }

    public UUID ownerFilter(UserPrincipal principal) {
        User user = requireUser(principal);
        if (user.getRole() == Role.ADMIN) {
            return null;
        }
        if (user.getRole() != Role.TEACHER) {
            throw new ResourceForbiddenException("Bạn không có quyền quản lý đề thi");
        }
        return user.getId();
    }

    public void assertCanManage(UserPrincipal principal, Quiz quiz) {
        User user = requireUser(principal);
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (user.getRole() != Role.TEACHER || quiz.getCreatedBy() == null
                || !user.getId().equals(quiz.getCreatedBy().getId())) {
            throw new ResourceForbiddenException("Bạn chỉ quản lý đề thi do mình tạo");
        }
    }

    private User requireUser(UserPrincipal principal) {
        if (principal == null || principal.getUsers() == null) {
            throw new ResourceForbiddenException("Không xác định được người dùng");
        }
        return principal.getUsers();
    }
}
