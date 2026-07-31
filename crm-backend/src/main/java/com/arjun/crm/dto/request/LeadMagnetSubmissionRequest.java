package com.arjun.crm.dto.request;

import lombok.*;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for public lead magnet form submission
 * This is what visitors submit when they fill out the landing page form
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadMagnetSubmissionRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Phone is required")
    @Size(min = 5, max = 20, message = "Phone must be between 5 and 20 characters")
    private String phone;

    @NotBlank(message = "Company is required")
    @Size(min = 2, max = 100, message = "Company must be between 2 and 100 characters")
    private String company;

    // Optional fields
    private String sourceUrl;  // Where they came from (e.g., LinkedIn, Facebook)
    private String notes;      // Any additional info they provided
}
