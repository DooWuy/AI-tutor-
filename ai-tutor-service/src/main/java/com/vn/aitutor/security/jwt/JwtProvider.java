package com.vn.aitutor.security.jwt;

import com.vn.aitutor.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;


@Component
@RequiredArgsConstructor
public class JwtProvider {

    private final TokenBlacklistService tokenBlacklistService;

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration}")
    private long expire;

    private Key key(){
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));// chuyen doi chuoi thanh key
    }

    // generate access token
    public String generateAccessToken(User users){
        Date now = new Date();
        Date expireDate = new Date(now.getTime() + expire);
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", users.getRole().name());
        claims.put("email", users.getEmail());
        claims.put("type", "access");
        return Jwts.builder()
                .setSubject(users.getUsername())
                .setIssuedAt(now)
                .setExpiration(expireDate)
                .addClaims(claims)
                .signWith(key(), SignatureAlgorithm.HS512)
                .compact();
    }

    // generate refresh token
    public String generateRefreshToken(User user){
        Date now = new Date();
        Date expireDate = new Date(now.getTime() + expire * 7);
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("email", user.getEmail());
        claims.put("type", "refresh");
        return Jwts.builder()
                .setSubject(user.getUsername())
                .setIssuedAt(now)
                .setExpiration(expireDate)
                .addClaims(claims)
                .signWith(key(), SignatureAlgorithm.HS512)
                .compact();
    }

    // validate token
    public boolean validateToken(String token, HttpServletRequest request){
        try {
            Jwts.parser()
                    .setSigningKey(key())
                    .parseClaimsJws(token);
            return true;
        }catch (ExpiredJwtException e) {
            request.setAttribute("error", "ExpiredJwtException");
        }catch (UnsupportedJwtException e) {
            request.setAttribute("error", "UnsupportedJwtException");
        }catch (IllegalArgumentException e) {
            request.setAttribute("error", "IllegalArgumentException");
        }catch (SignatureException e) {
            request.setAttribute("error", "SignatureException");
        }catch (MalformedJwtException e) {
            request.setAttribute("error", "MalformedJwtException");
        }
        return false;
    }

    // get username from token
    public String getUsernameFromToken(String token){
        try {
            return Jwts.parser()
                    .setSigningKey(key())
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        }catch (Exception e){
            return null;
        }
    }

    public String getTypeFromToken(String token){
        try {
            return Jwts.parser()
                    .setSigningKey(key())
                    .parseClaimsJws(token)
                    .getBody()
                    .get("type", String.class);
        }catch (Exception e){
            return null;
        }
    }

    public Date getExpirationFromToken(String token){
        try {
            return Jwts.parser()
                    .setSigningKey(key())
                    .parseClaimsJws(token)
                    .getBody()
                    .getExpiration();
        }catch (Exception e){
            return null;
        }
    }
}