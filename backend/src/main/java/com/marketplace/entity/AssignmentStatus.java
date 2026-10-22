package com.marketplace.entity;

public enum AssignmentStatus {
    ACTIVE,
    COMPLETED,
    TERMINATED;

    public static AssignmentStatus fromString(String value) {
        if (value == null) return null;
        for (AssignmentStatus s : AssignmentStatus.values()) {
            if (s.name().equalsIgnoreCase(value.trim())) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown assignment status: " + value);
    }
}

