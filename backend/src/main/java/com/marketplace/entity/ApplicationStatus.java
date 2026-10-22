package com.marketplace.entity;

public enum ApplicationStatus {
    PENDING,
    ACCEPTED,
    REJECTED;

    public static ApplicationStatus fromString(String value) {
        if (value == null) return null;
        for (ApplicationStatus s : ApplicationStatus.values()) {
            if (s.name().equalsIgnoreCase(value.trim())) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown application status: " + value);
    }
}

