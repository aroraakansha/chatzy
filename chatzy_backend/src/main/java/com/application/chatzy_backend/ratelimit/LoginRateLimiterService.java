package com.application.chatzy_backend.ratelimit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class LoginRateLimiterService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String LOGIN_ATTEMPTS_KEY_PREFIX = "login_attempts:";
    private static final String LOGIN_BLOCKED_KEY_PREFIX = "login_blocked:";
    private static final int MAX_ATTEMPTS = 5;
    private static final long BLOCK_DURATION_HOURS = 5;

    /**
     * Check if the user/email is currently blocked from login
     */
    public boolean isBlocked(String identifier) {
        String key = LOGIN_BLOCKED_KEY_PREFIX + identifier;
        Boolean isBlocked = redisTemplate.hasKey(key);
        if (Boolean.TRUE.equals(isBlocked)) {
            Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            log.warn("Login blocked for identifier: {}, TTL: {} seconds", identifier, ttl);
            return true;
        }
        return false;
    }

    /**
     * Record a failed login attempt
     * Returns true if max attempts reached and user should be blocked
     */
    public boolean recordFailedAttempt(String identifier) {
        String key = LOGIN_ATTEMPTS_KEY_PREFIX + identifier;
        
        Long currentAttempts = redisTemplate.opsForValue().increment(key);
        
        if (currentAttempts == null) {
            currentAttempts = 1L;
        }
        
        // Set expiration on first attempt (1 hour window)
        if (currentAttempts == 1) {
            redisTemplate.expire(key, 1, TimeUnit.HOURS);
        }
        
        log.info("Failed login attempt {} for identifier: {}", currentAttempts, identifier);
        
        // Block if max attempts reached
        if (currentAttempts >= MAX_ATTEMPTS) {
            blockUser(identifier);
            return true;
        }
        
        return false;
    }

    /**
     * Reset failed attempts on successful login
     */
    public void resetAttempts(String identifier) {
        String key = LOGIN_ATTEMPTS_KEY_PREFIX + identifier;
        redisTemplate.delete(key);
        log.info("Reset login attempts for identifier: {}", identifier);
    }

    /**
     * Block user for specified duration
     */
    private void blockUser(String identifier) {
        String key = LOGIN_BLOCKED_KEY_PREFIX + identifier;
        redisTemplate.opsForValue().set(key, "blocked", BLOCK_DURATION_HOURS, TimeUnit.HOURS);
        
        // Clear the attempts counter
        String attemptsKey = LOGIN_ATTEMPTS_KEY_PREFIX + identifier;
        redisTemplate.delete(attemptsKey);
        
        log.warn("User blocked for login for {} hours: {}", BLOCK_DURATION_HOURS, identifier);
    }

    /**
     * Get remaining attempts before block
     */
    public int getRemainingAttempts(String identifier) {
        String key = LOGIN_ATTEMPTS_KEY_PREFIX + identifier;
        Long attempts = redisTemplate.opsForValue().increment(key);
        
        if (attempts == null) {
            redisTemplate.delete(key);
            return MAX_ATTEMPTS;
        }
        
        // Decrement since we just incremented
        redisTemplate.opsForValue().decrement(key);
        
        return Math.max(0, MAX_ATTEMPTS - attempts.intValue());
    }

    /**
     * Get block remaining time in seconds
     */
    public Long getBlockRemainingTime(String identifier) {
        String key = LOGIN_BLOCKED_KEY_PREFIX + identifier;
        return redisTemplate.getExpire(key, TimeUnit.SECONDS);
    }
}
