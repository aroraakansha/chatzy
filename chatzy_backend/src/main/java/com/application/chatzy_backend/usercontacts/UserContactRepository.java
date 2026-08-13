package com.application.chatzy_backend.usercontacts;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserContactRepository extends JpaRepository<UserContact, UUID> {

    List<UserContact> findByOwnerId(UUID ownerId);

    boolean existsByOwnerIdAndContactEmail(UUID ownerId, String contactEmail);

    boolean existsByOwnerIdAndContactPhone(UUID ownerId, String contactPhone);

    // JPA understands owner.id because 'owner' is a property in UserContact
    Optional<UserContact> findByOwnerIdAndContactEmail(UUID ownerId, String contactEmail);
}