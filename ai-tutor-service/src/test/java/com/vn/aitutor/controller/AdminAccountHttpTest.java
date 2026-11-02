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
    @Import({UserController.class, GlobalExceptionHandler.class})
    static class Config {
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
}
