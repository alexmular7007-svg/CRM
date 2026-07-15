package com.arjun.crm.listener;

import com.arjun.crm.event.*;
import com.arjun.crm.service.CacheEvictionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listener for cache eviction on data changes
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CacheEvictionListener {

    private final CacheEvictionService cacheEvictionService;

    /**
     * Evict analytics caches when task is assigned
     */
    @EventListener
    @Async
    public void handleTaskAssigned(TaskAssignedEvent event) {
        log.debug("Task assigned event received, evicting analytics caches");
        cacheEvictionService.evictAnalyticsCache();
        cacheEvictionService.evictDashboardCache();
    }

    /**
     * Evict analytics caches when task is updated
     */
    @EventListener
    @Async
    public void handleTaskUpdated(TaskUpdatedEvent event) {
        log.debug("Task updated event received, evicting analytics caches");
        cacheEvictionService.evictAnalyticsCache();
        cacheEvictionService.evictDashboardCache();
    }

    /**
     * Evict analytics caches when comment is added
     */
    @EventListener
    @Async
    public void handleCommentAdded(CommentAddedEvent event) {
        log.debug("Comment added event received, evicting analytics caches");
        cacheEvictionService.evictAnalyticsCache();
        cacheEvictionService.evictDashboardCache();
    }

    /**
     * Evict dashboard cache when invitation is accepted
     * This ensures the new workspace membership is visible in the user's workspace list
     */
    @EventListener
    @Async
    public void handleInvitationAccepted(InvitationAcceptedEvent event) {
        log.info("Invitation accepted event received for user: {}, evicting dashboard caches", 
                 event.getAcceptedBy().getEmail());
        
        // Clear dashboard cache for the accepted user
        // This ensures their workspace list is refreshed
        cacheEvictionService.evictDashboardCache();
        
        // Also clear analytics cache in case they're on analytics page
        cacheEvictionService.evictAnalyticsCache();
        
        // Clear all workspace-related caches to be safe
        cacheEvictionService.evictAllCaches();
        
        log.debug("All caches evicted for user: {} after invitation acceptance", 
                  event.getAcceptedBy().getEmail());
    }
}
