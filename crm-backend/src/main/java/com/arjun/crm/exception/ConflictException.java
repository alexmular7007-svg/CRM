package com.arjun.crm.exception;

/**
 * Exception thrown when a resource conflict occurs (409)
 * E.g., attempting to convert an already-converted lead
 */
public class ConflictException extends RuntimeException {
    
    public ConflictException(String message) {
        super(message);
    }
    
    public ConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}
