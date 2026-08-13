package com.application.chatzy_backend.googlecontactsaccess;


import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GoogleCredentialRepository extends JpaRepository<GoogleCredential, UUID> {
}
