package com.application.chatzy_backend.ratelimit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@Slf4j
@RequiredArgsConstructor
public class LoginRateLimiterService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String LOGIN_ATTEMPTS_KEY_PREFIX = "login_attempts:";
    private static final String LOGIN_BLOCKED_KEY_PREFIX = "login_blocked:";
    private static final int MAX_ATTEMPTS = 5;
    private static final long BLOCK_DURATION_HOURS = 5;
    private static final long ATTEMPT_WINDOW_MILLIS = TimeUnit.HOURS.toMillis(1);
    private final ConcurrentMap<String, LocalLoginState> localStates = new ConcurrentHashMap<>();
    private final AtomicBoolean redisFallbackLogged = new AtomicBoolean();

    private static final class LocalLoginState {
        private int attempts;
        private long windowEndsAt;
        private long blockedUntil;
    }

    /**
     * Check if the user/email is currently blocked from login
     */
    public boolean isBlocked(String identifier) {
        String key = LOGIN_BLOCKED_KEY_PREFIX + identifier;
        try {
            Boolean isBlocked = redisTemplate.hasKey(key);
            if (Boolean.TRUE.equals(isBlocked)) {
                Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
                log.warn("Login blocked for identifier: {}, TTL: {} seconds", identifier, ttl);
                return true;
            }
            return false;
        } catch (RedisConnectionFailureException exception) {
            warnRedisFallback(exception);
            LocalLoginState state = localStates.get(identifier);
            return state != null && state.blockedUntil > System.currentTimeMillis();
        }
    }

    /**
     * Record a failed login attempt
     * Returns true if max attempts reached and user should be blocked
     */
    public boolean recordFailedAttempt(String identifier) {
        String key = LOGIN_ATTEMPTS_KEY_PREFIX + identifier;
        try {
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
        } catch (RedisConnectionFailureException exception) {
            warnRedisFallback(exception);
            return recordFailedAttemptLocally(identifier);
        }
    }

    /**
     * Reset failed attempts on successful login
     */
    public void resetAttempts(String identifier) {
        String key = LOGIN_ATTEMPTS_KEY_PREFIX + identifier;
        try {
            redisTemplate.delete(key);
        } catch (RedisConnectionFailureException exception) {
            warnRedisFallback(exception);
        } finally {
            localStates.remove(identifier);
        }
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
        try {
            Long attempts = redisTemplate.opsForValue().increment(key);

            if (attempts == null) {
                redisTemplate.delete(key);
                return MAX_ATTEMPTS;
            }

            // Decrement since we just incremented
            redisTemplate.opsForValue().decrement(key);

            return Math.max(0, MAX_ATTEMPTS - attempts.intValue());
        } catch (RedisConnectionFailureException exception) {
            warnRedisFallback(exception);
            LocalLoginState state = localStates.get(identifier);
            if (state == null || state.windowEndsAt <= System.currentTimeMillis()) return MAX_ATTEMPTS;
            return Math.max(0, MAX_ATTEMPTS - state.attempts);
        }
    }

    /**
     * Get block remaining time in seconds
     */
    public Long getBlockRemainingTime(String identifier) {
        String key = LOGIN_BLOCKED_KEY_PREFIX + identifier;
        try {
            return redisTemplate.getExpire(key, TimeUnit.SECONDS);
        } catch (RedisConnectionFailureException exception) {
            warnRedisFallback(exception);
            LocalLoginState state = localStates.get(identifier);
            return state == null ? 0L : Math.max(0L, TimeUnit.MILLISECONDS.toSeconds(state.blockedUntil - System.currentTimeMillis()));
        }
    }

    private boolean recordFailedAttemptLocally(String identifier) {
        long now = System.currentTimeMillis();
        LocalLoginState state = localStates.computeIfAbsent(identifier, ignored -> new LocalLoginState());
        synchronized (state) {
            if (state.blockedUntil > now) return true;
            if (state.windowEndsAt <= now) {
                state.attempts = 0;
                state.windowEndsAt = now + ATTEMPT_WINDOW_MILLIS;
            }
            state.attempts++;
            log.info("Failed login attempt {} for identifier: {} (local fallback)", state.attempts, identifier);
            if (state.attempts >= MAX_ATTEMPTS) {
                state.attempts = 0;
                state.windowEndsAt = 0;
                state.blockedUntil = now + TimeUnit.HOURS.toMillis(BLOCK_DURATION_HOURS);
                log.warn("Login blocked for identifier: {} (local fallback)", identifier);
                return true;
            }
            return false;
        }
    }

    private void warnRedisFallback(RedisConnectionFailureException exception) {
        if (redisFallbackLogged.compareAndSet(false, true)) {
            log.warn("Redis is unavailable; using process-local login rate limiting until Redis recovers: {}", exception.getMessage());
        }
    }
}
