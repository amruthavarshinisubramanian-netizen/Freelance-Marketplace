package com.marketplace.dto;

import com.marketplace.entity.Role;
import java.time.LocalDateTime;

public class UserDto {
    private Long userId;
    private String fullName;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
    private Boolean isActive;
    private Long projectsPosted;
    private Long applicationsSubmitted;

    public UserDto() {
    }

    public UserDto(Long userId, String fullName, String email, Role role, LocalDateTime createdAt, Boolean isActive) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.createdAt = createdAt;
        this.isActive = isActive;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Long getProjectsPosted() {
        return projectsPosted;
    }

    public void setProjectsPosted(Long projectsPosted) {
        this.projectsPosted = projectsPosted;
    }

    public Long getApplicationsSubmitted() {
        return applicationsSubmitted;
    }

    public void setApplicationsSubmitted(Long applicationsSubmitted) {
        this.applicationsSubmitted = applicationsSubmitted;
    }
}

