package com.application.chatzy_backend.otp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpRepository extends JpaRepository<Otp, UUID> {

    Optional<Otp> findTopByIdentifierOrderByCreatedAtDesc(String identifier);

    @Query("SELECT o FROM Otp o WHERE o.identifier = :identifier AND o.code = :code AND o.used = false AND o.expiresAt > :now")
    Optional<Otp> findValidOtp(@Param("identifier") String identifier, @Param("code") String code, @Param("now") LocalDateTime now);

    void deleteByIdentifier(String identifier);
}
