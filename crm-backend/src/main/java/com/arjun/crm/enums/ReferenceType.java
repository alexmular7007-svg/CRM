package com.arjun.crm.enums;

/**
 * Types of entities that notifications can reference.
 * Used to determine navigation and related entity lookup.
 */
public enum ReferenceType {
    TASK,
    COMMENT,
    PROJECT,
    WORKSPACE,
    CHAT_ROOM,
    LEAD,
    USER,
    SYSTEM
}
