package com.marketplace.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AdminDashboardStatsResponse {
    private boolean success = true;
    private Map<String, Object> stats;
    private List<ProjectResponse> recentProjects;
    private List<UserDto> recentUsers;

    public AdminDashboardStatsResponse() {
        this.success = true;
    }

    public AdminDashboardStatsResponse(Map<String, Object> stats, List<ProjectResponse> recentProjects, List<UserDto> recentUsers) {
        this.success = true;
        this.stats = stats;
        this.recentProjects = recentProjects;
        this.recentUsers = recentUsers;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public Map<String, Object> getStats() {
        return stats;
    }

    public void setStats(Map<String, Object> stats) {
        this.stats = stats;
    }

    public List<ProjectResponse> getRecentProjects() {
        return recentProjects;
    }

    public void setRecentProjects(List<ProjectResponse> recentProjects) {
        this.recentProjects = recentProjects;
    }

    public List<UserDto> getRecentUsers() {
        return recentUsers;
    }

    public void setRecentUsers(List<UserDto> recentUsers) {
        this.recentUsers = recentUsers;
    }
}

