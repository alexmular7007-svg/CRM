package com.arjun.crm.repository;

import com.arjun.crm.entity.Client;
import com.arjun.crm.entity.Lead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    
    /**
     * Find client by ID within a workspace
     */
    Optional<Client> findByIdAndWorkspaceId(Long id, Long workspaceId);
    
    /**
     * Find client by source lead (one-to-one)
     */
    Optional<Client> findBySourceLead(Lead sourceLead);
    
    /**
     * Find client by source lead ID
     */
    Optional<Client> findBySourceLeadId(Long sourceLeadId);
    
    /**
     * Check if client exists for a source lead
     */
    boolean existsBySourceLeadId(Long sourceLeadId);
    
    /**
     * List clients by workspace
     */
    Page<Client> findByWorkspaceId(Long workspaceId, Pageable pageable);
}
