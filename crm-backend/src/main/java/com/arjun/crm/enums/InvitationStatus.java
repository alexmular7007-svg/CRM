package com.arjun.crm.enums;

public enum InvitationStatus {
    PENDING,        // Awaiting acceptance
    ACCEPTED,       // Invitation accepted, member created
    EXPIRED,        // Token expired (7 days)
    REVOKED        // Manually revoked by owner/admin
}
