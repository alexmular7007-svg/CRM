package com.arjun.crm.repository;

import com.arjun.crm.entity.ChromeExtensionTestSuite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChromeExtensionTestSuiteRepository extends JpaRepository<ChromeExtensionTestSuite, Long> {

    List<ChromeExtensionTestSuite> findByExtensionIdOrderByCreatedAtDesc(Long extensionId);

    Page<ChromeExtensionTestSuite> findByExtensionId(Long extensionId, Pageable pageable);

    Optional<ChromeExtensionTestSuite> findByIdAndExtensionId(Long id, Long extensionId);

    boolean existsByExtensionIdAndNameIgnoreCase(Long extensionId, String name);

    boolean existsByExtensionIdAndNameIgnoreCaseAndIdNot(Long extensionId, String name, Long id);

    long countByExtensionId(Long extensionId);
}
