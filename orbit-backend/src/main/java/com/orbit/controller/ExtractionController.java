package com.orbit.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.ExtractRequest;
import com.orbit.dto.ExtractResponse;
import com.orbit.service.ExtractionService;

@RestController
@RequestMapping("/api")
public class ExtractionController {
    private final ExtractionService extractionService;
    public ExtractionController(ExtractionService extractionService) {
        this.extractionService = extractionService;
    }

    @PostMapping("/extract")
    public ExtractResponse extract(@RequestBody ExtractRequest request) {
        return extractionService.extractFromSnippet(request);
    }
}
