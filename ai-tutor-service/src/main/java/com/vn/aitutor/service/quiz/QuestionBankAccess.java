package com.vn.aitutor.service.quiz;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.repository.QuestionBankRepository;
import java.util.*;
@Component("questionBankAccess")
@RequiredArgsConstructor
public class QuestionBankAccess {
    private final QuestionBankRepository questions;
    public boolean manage(Authentication auth,UUID id) {
        if(!(auth.getPrincipal() instanceof UserPrincipal p))return false;
        if(p.getUsers().getRole()==Role.ADMIN)return true;
        return p.getUsers().getRole()==Role.TEACHER && questions.findById(id).map(q->q.getCreatedBy()!=null&&p.getUsers().getId().equals(q.getCreatedBy().getId())).orElse(false);
    }
    public boolean read(Authentication auth,UUID id) {
        if(!(auth.getPrincipal() instanceof UserPrincipal p) || (p.getUsers().getRole()!=Role.ADMIN && p.getUsers().getRole()!=Role.TEACHER))return false;
        return questions.findById(id).map(q->q.getReviewStatus()==com.vn.aitutor.entity.enums.ReviewStatus.ACTIVE).orElse(false)||manage(auth,id);
    }
    public boolean all(Authentication auth,List<UUID> ids) {return ids!=null&&ids.stream().allMatch(id->manage(auth,id));}
    public boolean batch(Authentication auth,UUID id) {
        var rows=questions.findByBatchIdAndReviewStatusOrderByCreatedAtAsc(id,com.vn.aitutor.entity.enums.ReviewStatus.PENDING);
        return !rows.isEmpty()&&rows.stream().allMatch(q->manage(auth,q.getId()));
    }
}
