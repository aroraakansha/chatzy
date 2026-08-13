package com.application.chatzy_backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    // Spring Data JPA creates the SQL automatically for these methods
    Optional<User> findByUsername(String username);

    // Inside UserRepository.java
    Optional<User> findByEmail(String email); // Replace findByUsername
    
    Optional<User> findByPhone(String phone);
}