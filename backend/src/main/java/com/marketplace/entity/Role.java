package com.marketplace.entity;

public enum Role {
    ADMIN,
    CLIENT,
    FREELANCER;

    public static Role fromString(String value) {
        if (value == null) return null;
        for (Role r : Role.values()) {
            if (r.name().equalsIgnoreCase(value.trim())) {
                return r;
            }
        }
        throw new IllegalArgumentException("Unknown role: " + value);
    }
}

