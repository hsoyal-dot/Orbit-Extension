package com.orbit.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "Orbit Backend API");
        response.put("endpoints", Map.of(
            "extract", "/api/extract (POST)",
            "saveEvent", "/api/saveEvent (POST)",
            "events", "/api/events (GET)",
            "exportIcs", "/api/export/ics (GET)"
        ));
        return response;
    }
}

