package com.vn.aitutor.controller;
import com.vn.aitutor.service.quiz.QuizAccess;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@RestController
@RequestMapping("/api/v1/quizzes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
public class QuizReportController {
    private final QuizAccess access;
    private final JdbcTemplate jdbc;
    @GetMapping("/{id}/report")
    @Transactional(readOnly=true,isolation=org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
    @io.swagger.v3.oas.annotations.Operation(summary="Quiz results: SQL aggregates and paginated students; includes hidden submitted history")
    public ApiResponse<Map<String,Object>> report(@PathVariable UUID id,@RequestParam(defaultValue="1") int page,
            @RequestParam(defaultValue="20") int size,@AuthenticationPrincipal UserPrincipal principal) {
        if(page<1||size<1||size>50) throw new com.vn.aitutor.exception.ResourceBadRequestException("Phân trang không hợp lệ");
        var quiz=access.require(id,principal);
        var stats=jdbc.queryForMap("select count(*) as attempts,avg(score) as average from quiz_attempts where quiz_id=? and submitted_at is not null and score is not null",id);
        var totals=jdbc.queryForMap("select count(*) as total, count(*) filter(where best>=?) as passed from (select student_id,max(score) as best from quiz_attempts where quiz_id=? and submitted_at is not null and score is not null group by student_id) x",quiz.getPassingScore(),id);
        long total=((Number)totals.get("total")).longValue();
        var students=jdbc.query("""
            select s.id,s.student_code,u.full_name,coalesce(c.name,s.class_name) as class_name,
                max(a.score) as best,count(*) as attempts,max(a.submitted_at) as latest
            from quiz_attempts a join students s on s.id=a.student_id join users u on u.id=s.user_id
            left join school_classes c on c.id=s.class_id
            where a.quiz_id=? and a.submitted_at is not null and a.score is not null
            group by s.id,u.id,c.name order by max(a.submitted_at) desc,s.id limit ? offset ?
            """,(rs,n)->{
                Map<String,Object> row=new LinkedHashMap<>();row.put("studentId",rs.getObject("id"));row.put("studentCode",rs.getString("student_code"));row.put("fullName",rs.getString("full_name"));row.put("className",rs.getString("class_name"));row.put("bestScore",rs.getDouble("best"));row.put("attemptCount",rs.getLong("attempts"));row.put("passed",rs.getBigDecimal("best").compareTo(quiz.getPassingScore())>=0);row.put("lastSubmittedAt",rs.getTimestamp("latest").toInstant());return row;
            },id,size,(long)(page-1)*size);
        Map<String,Object> result=new LinkedHashMap<>();result.put("quizId",id);result.put("title",quiz.getTitle());result.put("passingScore",quiz.getPassingScore());result.put("attemptCount",stats.get("attempts"));result.put("averageScore",stats.get("average"));result.put("passingRate",total==0?0:((Number)totals.get("passed")).doubleValue()*100/total);result.put("students",students);result.put("hardestQuestions",List.of());result.put("page",page);result.put("size",size);result.put("totalElements",total);result.put("totalPages",(total+size-1)/size);
        return ApiResponse.<Map<String,Object>>builder().success(true).data(result).build();
    }
}
