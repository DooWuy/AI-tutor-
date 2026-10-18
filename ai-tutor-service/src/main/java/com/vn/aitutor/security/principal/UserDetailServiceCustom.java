package com.vn.aitutor.security.principal;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class UserDetailServiceCustom implements UserDetailsService {
    private final UserRepository userRepository;
    private final UserPrincipalCache userPrincipalCache;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        UserDetails cached = userPrincipalCache.get(identifier);
        if (cached != null) {
            return cached;
        }

        User users = userRepository.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue(identifier)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tên người dùng hoặc email: " + identifier));

        UserPrincipal principal = UserPrincipal.builder()
                .users(users)
                .authorities(
                        users.getRole() != null
                                ? Collections.singleton(new SimpleGrantedAuthority("ROLE_" + users.getRole().name()))
                                : Collections.emptyList()
                )
                .build();

        userPrincipalCache.put(identifier, principal);
        if (users.getUsername() != null && !users.getUsername().equalsIgnoreCase(identifier)) {
            userPrincipalCache.put(users.getUsername(), principal);
        }
        if (users.getEmail() != null && !users.getEmail().equalsIgnoreCase(identifier)) {
            userPrincipalCache.put(users.getEmail(), principal);
        }

        return principal;
    }
}