package com.application.chatzy_backend.usercontacts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserContactRepository extends JpaRepository<UserContact, UUID> {

    List<UserContact> findByOwnerId(UUID ownerId);

    boolean existsByOwnerIdAndContactEmail(UUID ownerId, String contactEmail);

    boolean existsByOwnerIdAndContactPhone(UUID ownerId, String contactPhone);

    // JPA understands owner.id because 'owner' is a property in UserContact
    Optional<UserContact> findByOwnerIdAndContactEmail(UUID ownerId, String contactEmail);

    List<UserContact> findByOwnerIdAndMatchedUserId(UUID ownerId, UUID matchedUserId);

    @Query("SELECT c FROM UserContact c WHERE c.owner.id = :ownerId AND (LOWER(c.contactName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(c.contactEmail) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(c.contactPhone) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<UserContact> searchContacts(@Param("ownerId") UUID ownerId, @Param("query") String query);
}