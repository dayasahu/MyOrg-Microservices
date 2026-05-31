package com.daya.auth.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class UserLookupService {

    // TODO: replace with database lookup
    public Map<String, Object> getClaimsForUser(String userId) {
        return Map.of(
                "username", "John Doe",
                "email", "john.doe@company.com",
                "roles", List.of("USER"),
                "department", "IT"
        );
    }
}