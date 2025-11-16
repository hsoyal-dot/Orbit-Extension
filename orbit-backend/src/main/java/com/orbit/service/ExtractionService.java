package com.orbit.service;

import java.util.ArrayList;

import org.springframework.stereotype.Service;

import com.orbit.dto.ExtractRequest;
import com.orbit.dto.ExtractResponse;
import com.orbit.dto.ExtractedEvent;

@Service
public class ExtractionService {
    // For demo: mocked extraction. Replace with real LLM call.
    public ExtractResponse extractFromSnippet(ExtractRequest req) {
        ExtractResponse resp = new ExtractResponse();
        resp.detected = new ArrayList<>();
        // MOCK: if snippet or title contains a YYYY- pattern, parse it (very simple)
        if (req.snippet() != null && req.snippet().matches(".*\\d{4}-\\d{2}-\\d{2}.*")) {
            ExtractedEvent ev = new ExtractedEvent();
            ev.title = req.title() + " - Detected Event";
            ev.date = req.snippet().replaceAll("(?s).*?(\\d{4}-\\d{2}-\\d{2}).*", "$1");
            ev.time = null;
            ev.tag = "Educational";
            ev.confidence = 0.9;
            ev.source_snippet = req.snippet().length() > 240 ? req.snippet().substring(0, 240) : req.snippet();
            ev.url = req.url();
            resp.detected.add(ev);
        }
        return resp;
    }

}
