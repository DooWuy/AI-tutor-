package com.vn.aitutor.service.quiz;
import com.vn.aitutor.entity.*;
import com.vn.aitutor.entity.enums.*;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.*;
class QuestionBankAccessTest {
    org.springframework.security.core.Authentication actor(Role role,UUID id) {
        User user=new User();user.setId(id);user.setRole(role);
        return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(UserPrincipal.builder().users(user).build(),null,List.of());
    }
    @Test void activeBankIsSharedButDraftsAndMutationsAreOwnerScoped() {
        var repo=mock(QuestionBankRepository.class);var access=new QuestionBankAccess(repo);UUID id=UUID.randomUUID(),ownerId=UUID.randomUUID();
        var q=new QuestionBankItem();q.setId(id);var user=new User();user.setId(ownerId);q.setCreatedBy(user);q.setReviewStatus(ReviewStatus.PENDING);
        when(repo.findById(id)).thenReturn(Optional.of(q));
        var owner=actor(Role.TEACHER,ownerId);var other=actor(Role.TEACHER,UUID.randomUUID());var admin=actor(Role.ADMIN,UUID.randomUUID());
        assertTrue(access.manage(owner,id));assertTrue(access.manage(admin,id));assertFalse(access.manage(other,id));assertFalse(access.read(other,id));
        q.setReviewStatus(ReviewStatus.ACTIVE);assertTrue(access.read(other,id));assertFalse(access.read(actor(Role.STUDENT,UUID.randomUUID()),id));
        assertFalse(access.all(other,List.of(id)));
    }
}
