package com.arjun.crm.repository;

import com.arjun.crm.entity.ChromeExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChromeExtensionRepository extends JpaRepository<ChromeExtension, Long> {

    Page<ChromeExtension> findByWorkspaceIdAndArchivedAtIsNull(Long workspaceId, Pageable pageable);

    Page<ChromeExtension> findByWorkspaceIdAndNameContainingIgnoreCaseAndArchivedAtIsNull(
            Long workspaceId, String name, Pageable pageable);

    Optional<ChromeExtension> findByIdAndWorkspaceIdAndArchivedAtIsNull(Long id, Long workspaceId);

    Optional<ChromeExtension> findByIdAndWorkspaceId(Long id, Long workspaceId);

    boolean existsByWorkspaceIdAndNameAndArchivedAtIsNull(Long workspaceId, String name);

    boolean existsByWorkspaceIdAndNameAndIdNotAndArchivedAtIsNull(Long workspaceId, String name, Long id);
}
