package com.orbit.service;

import java.util.ArrayList;

import org.springframework.stereotype.Service;

import com.orbit.dto.ExtractRequest;
import com.orbit.dto.ExtractResponse;
import com.orbit.dto.ExtractedEvent;
import com.orbit.service.GeminiService.EventExtraction;

@Service
public class ExtractionService {

    private final GeminiService geminiService;

    public ExtractionService(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    public ExtractResponse extractFromSnippet(ExtractRequest req) {
        ExtractResponse resp = new ExtractResponse();
        resp.detected = new ArrayList<>();

        // Use Gemini AI to extract event information
        EventExtraction extraction = geminiService.extractEventInfo(
                req.snippet() != null ? req.snippet() : "",
                req.title() != null ? req.title() : "",
                req.url() != null ? req.url() : "");

        // Convert to ExtractedEvent
        ExtractedEvent ev = new ExtractedEvent();
        ev.title = extraction.title;
        ev.date = extraction.date;
        ev.time = extraction.time;
        ev.tag = extraction.tag;
        ev.confidence = extraction.confidence;
        ev.source_snippet = extraction.sourceSnippet != null && extraction.sourceSnippet.length() > 240
                ? extraction.sourceSnippet.substring(0, 240)
                : extraction.sourceSnippet;
        ev.url = extraction.url;

        // Only add if we have some confidence or a date
        if (ev.confidence > 0.3 || ev.date != null) {
            resp.detected.add(ev);
        }

        return resp;
    }
}
