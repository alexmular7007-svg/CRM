package com.arjun.crm.repository;

import com.arjun.crm.entity.ChromeExtensionTestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChromeExtensionTestCaseRepository extends JpaRepository<ChromeExtensionTestCase, Long> {

    List<ChromeExtensionTestCase> findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(Long extensionId);

    Optional<ChromeExtensionTestCase> findByIdAndExtensionId(Long id, Long extensionId);

    long countByExtensionId(Long extensionId);

    long countByExtensionIdAndEnabledTrue(Long extensionId);
}
