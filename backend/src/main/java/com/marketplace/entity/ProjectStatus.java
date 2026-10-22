package com.marketplace.entity;

public enum ProjectStatus {
    OPEN,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED;

    public static ProjectStatus fromString(String value) {
        if (value == null) return null;
        String normalized = value.trim().toUpperCase().replace(" ", "_");
        for (ProjectStatus s : ProjectStatus.values()) {
            if (s.name().equalsIgnoreCase(normalized)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown project status: " + value);
    }
}

