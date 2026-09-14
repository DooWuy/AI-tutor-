package com.vn.aitutor.security;

import com.vn.aitutor.domain.User;
import com.vn.aitutor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("userSecurity")
@RequiredArgsConstructor
public class UserSecurity {

    private final UserRepository userRepository;

    public boolean isOwner(Authentication authentication, UUID userId) {
        String currentUsername = authentication.getName();
        return userRepository.findById(userId)
                .map(user -> user.getUsername().equals(currentUsername))
                .orElseGet(() -> false);
    }
}
