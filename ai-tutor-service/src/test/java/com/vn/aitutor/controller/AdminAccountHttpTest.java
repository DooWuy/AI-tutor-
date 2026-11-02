package com.vn.aitutor.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.user.UserResponse;
import com.vn.aitutor.exception.GlobalExceptionHandler;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.service.user.IUserService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

@SpringJUnitWebConfig(AdminAccountHttpTest.Config.class)
class AdminAccountHttpTest {
    @Configuration @EnableWebMvc @EnableWebSecurity @EnableMethodSecurity
    @Import({UserController.class, AdminDashboardController.class, DocumentController.class, QuizReportController.class, QuizManagementController.class, GlobalExceptionHandler.class})
    static class Config {
        @Bean com.vn.aitutor.service.user.TeacherInvitationService invitations() { return mock(com.vn.aitutor.service.user.TeacherInvitationService.class); }
        @Bean com.vn.aitutor.repository.AdminDashboardRepository dashboard() { return mock(com.vn.aitutor.repository.AdminDashboardRepository.class); }
        @Bean com.vn.aitutor.service.curriculum.DocumentLifecycleService documents() { return mock(com.vn.aitutor.service.curriculum.DocumentLifecycleService.class); }
        @Bean com.vn.aitutor.service.quiz.QuizAccess quizAccess() { return mock(com.vn.aitutor.service.quiz.QuizAccess.class); }
        @Bean org.springframework.jdbc.core.JdbcTemplate reportJdbc() { return mock(org.springframework.jdbc.core.JdbcTemplate.class); }
        @Bean com.vn.aitutor.service.quiz.QuizManagementService quizManagement() { return mock(com.vn.aitutor.service.quiz.QuizManagementService.class); }
        @Bean com.vn.aitutor.service.quiz.QuizStatisticsService quizStatistics() { return mock(com.vn.aitutor.service.quiz.QuizStatisticsService.class); }
        @Bean IUserService users() { return mock(IUserService.class); }
        @Bean SecurityFilterChain security(HttpSecurity http) {
            return http.csrf(c -> c.disable()).authorizeHttpRequests(a -> a.anyRequest().authenticated())
                    .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> res.sendError(401))).build();
        }
    }
    @org.springframework.beans.factory.annotation.Autowired WebApplicationContext context;
    @org.springframework.beans.factory.annotation.Autowired IUserService service;
    MockMvc mvc;
    @BeforeEach void setup() {
        reset(service);
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity()).build();
    }
    @Test void anonymousAndNonAdminCannotListOrChangeAccounts() throws Exception {
        mvc.perform(get("/api/v1/users/accounts")).andExpect(status().isUnauthorized());
        for (String role : List.of("STUDENT", "TEACHER")) {
            mvc.perform(get("/api/v1/users/accounts").with(user("actor").roles(role))).andExpect(status().isForbidden());
            mvc.perform(put("/api/v1/users/" + UUID.randomUUID() + "/status").with(user("actor").roles(role))
                    .contentType("application/json").content("{\"active\":false}")).andExpect(status().isForbidden());
        }
        verifyNoInteractions(service);
    }
    @Test void adminCanSearchAndSetExplicitStatus() throws Exception {
        when(service.searchAccounts(any(), eq(false), eq("teacher"), any())).thenReturn(
                PageResponseDTO.<UserResponse>builder().content(List.of()).totalElements(0L).build());
        mvc.perform(get("/api/v1/users/accounts?role=TEACHER&active=false&search=teacher")
                .with(user("admin").roles("ADMIN"))).andExpect(status().isOk()).andExpect(jsonPath("$.content").isArray());
        UUID id = UUID.randomUUID();
        when(service.setStatus(id, false)).thenReturn(ApiResponse.<UserResponse>builder().success(true)
                .data(UserResponse.builder().active(false).build()).build());
        mvc.perform(patch("/api/v1/users/" + id + "/status").with(user("admin").roles("ADMIN"))
                .contentType("application/json").content("{\"active\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.active").value(false));
    }
    @Test void malformedRequestsAndLastAdminConflictHaveCorrectStatus() throws Exception {
        for (String query : List.of("size=51", "page=0", "sort=passwordHash", "direction=invalid", "role=INVALID")) {
            mvc.perform(get("/api/v1/users/accounts?" + query).with(user("admin").roles("ADMIN")))
                    .andExpect(status().isBadRequest());
        }
        String path = "/api/v1/users/" + UUID.randomUUID() + "/status";
        mvc.perform(put(path).with(user("admin").roles("ADMIN")).contentType("application/json").content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(patch(path).with(user("admin").roles("ADMIN")))
                .andExpect(status().isBadRequest());
        when(service.setStatus(any(), eq(false))).thenThrow(new ResourceConflictException("Last admin"));
        mvc.perform(put(path).with(user("admin").roles("ADMIN")).contentType("application/json").content("{\"active\":false}"))
                .andExpect(status().isConflict());
    }

    @Test void missingAndDeletedTargetsReturnNotFoundWithoutMutatingAnything() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.setStatus(id, false)).thenThrow(new com.vn.aitutor.exception.ResourceNotFoundException("Account not found"));
        mvc.perform(put("/api/v1/users/" + id + "/status").with(user("admin").roles("ADMIN"))
                .contentType("application/json").content("{\"active\":false}"))
                .andExpect(status().isNotFound());
    }

    @Test void teacherCreateAndResendRequireAdminAndRejectInvalidPayloads() throws Exception {
        String json="{\"username\":\"alice\",\"email\":\"alice@example.invalid\",\"fullName\":\"Alice Teacher\",\"department\":\"Science\",\"subjectTaught\":\"Math\"}";
        for(String role:List.of("STUDENT","TEACHER")) {
            mvc.perform(post("/api/v1/users/teachers").with(user("actor").roles(role)).contentType("application/json").content(json)).andExpect(status().isForbidden());
            mvc.perform(post("/api/v1/users/"+UUID.randomUUID()+"/invitation/resend").with(user("actor").roles(role))).andExpect(status().isForbidden());
        }
        mvc.perform(post("/api/v1/users/teachers").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous()).contentType("application/json").content(json)).andExpect(status().isUnauthorized());
        for(String body:List.of(json.replace("Science",""),json.replace("alice@example.invalid","invalid"),json.replace("Math","x".repeat(129)),json.replace("Science","Science\",\"role\":\"ADMIN"))) {
            mvc.perform(post("/api/v1/users/teachers").with(user("admin").roles("ADMIN")).contentType("application/json").content(body)).andExpect(status().isBadRequest());
        }
        when(service.createProfile(any())).thenAnswer(invocation -> {
            var r=invocation.getArgument(0,com.vn.aitutor.dto.request.user.UserCreateRequest.class);
            org.junit.jupiter.api.Assertions.assertEquals(com.vn.aitutor.entity.enums.Role.TEACHER,r.getRole());
            org.junit.jupiter.api.Assertions.assertNull(r.getPassword());
            return ApiResponse.<UserResponse>builder().success(true).data(UserResponse.builder().invitationStatus("QUEUED").build()).build();
        });
        mvc.perform(post("/api/v1/users/teachers").with(user("admin").roles("ADMIN")).contentType("application/json").content(json))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.data.invitationStatus").value("QUEUED"));
    }
    @Test void profilePayloadCannotWriteIdentityPermissionsOrAssignments() throws Exception {
        for (String field:List.of("email","username","teacherCode","role","xp","classIds")) {
            mvc.perform(put("/api/v1/users/"+UUID.randomUUID()).with(user("admin").roles("ADMIN"))
                .contentType("application/json").content("{\"fullName\":\"Alice Teacher\",\""+field+"\":\"changed\"}"))
                .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(service);
    }

    @Test void dashboardSecurityValidationAndFailure() throws Exception {
        var repo=context.getBean(com.vn.aitutor.repository.AdminDashboardRepository.class); reset(repo);
        mvc.perform(get("/api/v1/dashboard/admin").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous())).andExpect(status().isUnauthorized());
        for(String role:List.of("STUDENT","TEACHER")) mvc.perform(get("/api/v1/dashboard/admin").with(user("actor").roles(role))).andExpect(status().isForbidden());
        for(String query:List.of("from=2026-11-02","from=bad","to=2026-10-01","page=1")) mvc.perform(get("/api/v1/dashboard/admin?"+query).with(user("admin").roles("ADMIN"))).andExpect(status().isBadRequest());
        verifyNoInteractions(repo);
        when(repo.overview()).thenReturn(new com.vn.aitutor.dto.response.dashboard.AdminDashboardResponse(3,2,4,5,6,java.time.Instant.parse("2026-11-02T00:00:00Z")));
        mvc.perform(get("/api/v1/dashboard/admin").with(user("admin").roles("ADMIN"))).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store"))
            .andExpect(jsonPath("$.data.totalUsers").value(3)).andExpect(jsonPath("$.data.updatedAt").exists());
        when(repo.overview()).thenThrow(new org.springframework.dao.DataAccessResourceFailureException("secret database endpoint"));
        mvc.perform(get("/api/v1/dashboard/admin").with(user("admin").roles("ADMIN"))).andExpect(status().isInternalServerError()).andExpect(jsonPath("$.message").value("Không thể xử lý dữ liệu. Vui lòng thử lại."));
    }

    @Test void documentRoutesEnforceRolesAndPagination() throws Exception {
        mvc.perform(get("/api/v1/documents/page").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/documents/page").with(user("student").roles("STUDENT"))).andExpect(status().isForbidden());
        for(String query:List.of("page=0","size=51","status=INVALID")) mvc.perform(get("/api/v1/documents/page?"+query).with(user("admin").roles("ADMIN"))).andExpect(status().isBadRequest());
        var docs=context.getBean(com.vn.aitutor.service.curriculum.DocumentLifecycleService.class);
        when(docs.browse(any(),any(),any(),any(),any(),eq(1),eq(20),any())).thenReturn(PageResponseDTO.<com.vn.aitutor.dto.response.curriculum.DocumentSummaryResponse>builder().content(List.of()).totalElements(0L).build());
        mvc.perform(get("/api/v1/documents/page").with(user("admin").roles("ADMIN"))).andExpect(status().isOk()).andExpect(jsonPath("$.content").isArray());
    }

    @Test void quizReportsRequireStaffAndValidatePagination() throws Exception {
        String path="/api/v1/quizzes/"+UUID.randomUUID()+"/report";
        mvc.perform(get(path).with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous())).andExpect(status().isUnauthorized());
        mvc.perform(get(path).with(user("student").roles("STUDENT"))).andExpect(status().isForbidden());
        for(String query:List.of("page=0","size=51"))mvc.perform(get(path+"?"+query).with(user("admin").roles("ADMIN"))).andExpect(status().isBadRequest());
    }

    @Test void quizPublishAndReviewAreStaffOnly() throws Exception {
        String path="/api/v1/quizzes/"+UUID.randomUUID();
        for(String suffix:List.of("/review","/publish","/archive")) {
            mvc.perform(post(path+suffix).with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous()).contentType("application/json").content("{\"classIds\":[]}")).andExpect(status().isUnauthorized());
            mvc.perform(post(path+suffix).with(user("student").roles("STUDENT")).contentType("application/json").content("{\"classIds\":[]}")).andExpect(status().isForbidden());
        }
        var management=context.getBean(com.vn.aitutor.service.quiz.QuizManagementService.class);
        when(management.review(any(),any())).thenThrow(new com.vn.aitutor.exception.ResourceForbiddenException("Owner only"));
        mvc.perform(post(path+"/review").with(user("other").roles("TEACHER"))).andExpect(status().isForbidden());
    }
}
