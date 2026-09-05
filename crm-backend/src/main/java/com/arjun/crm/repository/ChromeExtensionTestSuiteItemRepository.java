package com.arjun.crm.repository;

import com.arjun.crm.entity.ChromeExtensionTestSuiteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChromeExtensionTestSuiteItemRepository extends JpaRepository<ChromeExtensionTestSuiteItem, Long> {

    List<ChromeExtensionTestSuiteItem> findBySuiteIdOrderByExecutionOrderAsc(Long suiteId);

    void deleteBySuiteId(Long suiteId);

    boolean existsByTestCaseId(Long testCaseId);
}
