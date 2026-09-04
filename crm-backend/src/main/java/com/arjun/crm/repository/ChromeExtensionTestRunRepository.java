package com.arjun.crm.repository;

import com.arjun.crm.entity.ChromeExtensionTestRun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChromeExtensionTestRunRepository extends JpaRepository<ChromeExtensionTestRun, Long> {

    Page<ChromeExtensionTestRun> findByExtensionIdOrderByCreatedAtDesc(Long extensionId, Pageable pageable);

    Optional<ChromeExtensionTestRun> findByIdAndExtensionId(Long id, Long extensionId);
}
