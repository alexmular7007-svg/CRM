package com.arjun.crm.repository;

import com.arjun.crm.entity.ChromeExtensionTestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChromeExtensionTestResultRepository extends JpaRepository<ChromeExtensionTestResult, Long> {

    List<ChromeExtensionTestResult> findByTestRunIdOrderByCreatedAtAsc(Long testRunId);
}
