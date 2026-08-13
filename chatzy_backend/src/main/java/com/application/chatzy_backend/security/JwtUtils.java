package com.application.chatzy_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String secretKey;

    // ✅ Convert string secret to proper SecretKey object
    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String email) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + 86400000)) // Set to 24 hours
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        if (claims == null) return null;
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (io.jsonwebtoken.security.SignatureException e) {
            System.err.println("DEBUG: Signature verification failed! The key used to sign the token does not match the current secret key.");
            return null;
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            System.err.println("DEBUG: Token has expired.");
            return null;
        } catch (JwtException | IllegalArgumentException e) {
            System.err.println("DEBUG: JWT parsing failed: " + e.getMessage());
            return null;
        }
    }

    public boolean validateToken(String token) {
        Claims claims = extractAllClaims(token);
        if (claims == null) {
            return false;
        }

        // Safety check: only validate if expiration exists
        Date expiration = claims.getExpiration();
        return expiration != null && expiration.after(new Date());
    }

    @PostConstruct
    public void init() {
        System.out.println("DEBUG: Secret Key used: " + secretKey);
        System.out.println("DEBUG: Key Length: " + secretKey.length());
    }
}