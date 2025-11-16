package com.orbit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
    private String apiUrl;

    public GeminiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Extract event information from text using Gemini AI
     */
    public EventExtraction extractEventInfo(String snippet, String title, String url) {
        if (apiKey == null || apiKey.isEmpty()) {
            // Fallback to basic extraction if API key not configured
            return extractBasicInfo(snippet, title);
        }

        try {
            String prompt = buildPrompt(snippet, title, url);
            String response = callGeminiAPI(prompt);
            return parseGeminiResponse(response, snippet, title, url);
        } catch (Exception e) {
            System.err.println("Gemini API error: " + e.getMessage());
            // Fallback to basic extraction
            return extractBasicInfo(snippet, title);
        }
    }

    private String buildPrompt(String snippet, String title, String url) {
        return String.format(
                "Extract event information from the following text. Return a JSON object with these fields: " +
                        "title (a clear, concise event title), date (YYYY-MM-DD format if found, or null), " +
                        "time (HH:MM format if found, or null), tag (one of: Educational, Personal, Event, Work), " +
                        "description (a brief description of the event, max 200 characters), " +
                        "confidence (0.0 to 1.0 based on how certain you are this is an event). " +
                        "Text to analyze:\n\nTitle: %s\nURL: %s\nContent: %s\n\n" +
                        "Return ONLY valid JSON, no markdown, no code blocks, just the JSON object.",
                title, url != null ? url : "N/A", snippet);
    }

    private String callGeminiAPI(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        content.put("parts", new Object[] { part });
        requestBody.put("contents", new Object[] { content });

        // Add generation config for better results
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("topK", 40);
        generationConfig.put("topP", 0.95);
        generationConfig.put("maxOutputTokens", 1024);
        requestBody.put("generationConfig", generationConfig);

        String url = apiUrl + "?key=" + apiKey;
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            } else {
                throw new RuntimeException("Gemini API returned status: " + response.getStatusCode() +
                        ", body: " + response.getBody());
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            System.err.println("Gemini API HTTP error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            throw new RuntimeException("Gemini API error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(),
                    e);
        } catch (org.springframework.web.client.RestClientException e) {
            System.err.println("Gemini API request error: " + e.getMessage());
            throw new RuntimeException("Gemini API request failed: " + e.getMessage(), e);
        }
    }

    private EventExtraction parseGeminiResponse(String response, String snippet, String title, String url) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode content = candidates.get(0).path("content");
                JsonNode parts = content.path("parts");
                if (parts.isArray() && parts.size() > 0) {
                    String text = parts.get(0).path("text").asText();
                    // Try to extract JSON from the response
                    String jsonText = extractJsonFromText(text);
                    if (jsonText != null) {
                        JsonNode eventData = objectMapper.readTree(jsonText);
                        EventExtraction extraction = new EventExtraction();
                        extraction.title = eventData.path("title").asText(title);
                        extraction.date = eventData.path("date").asText(null);
                        extraction.time = eventData.path("time").asText(null);
                        extraction.tag = eventData.path("tag").asText("Event");
                        extraction.description = eventData.path("description").asText("");
                        extraction.confidence = eventData.path("confidence").asDouble(0.8);
                        extraction.sourceSnippet = snippet;
                        extraction.url = url;
                        return extraction;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing Gemini response: " + e.getMessage());
        }
        // Fallback
        return extractBasicInfo(snippet, title);
    }

    private String extractJsonFromText(String text) {
        // Try to find JSON object in the text
        int start = text.indexOf("{");
        int end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return null;
    }

    private EventExtraction extractBasicInfo(String snippet, String title) {
        EventExtraction extraction = new EventExtraction();
        extraction.title = title != null && !title.isEmpty() ? title : "Untitled Event";
        extraction.date = extractDate(snippet);
        extraction.time = extractTime(snippet);
        extraction.tag = "Event";
        extraction.description = snippet.length() > 200 ? snippet.substring(0, 200) + "..." : snippet;
        extraction.confidence = extraction.date != null ? 0.7 : 0.5;
        extraction.sourceSnippet = snippet;
        extraction.url = null;
        return extraction;
    }

    private String extractDate(String text) {
        // Try to find YYYY-MM-DD pattern
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\d{4}-\\d{2}-\\d{2}");
        java.util.regex.Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    private String extractTime(String text) {
        // Try to find HH:MM pattern
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b\\d{1,2}:\\d{2}\\s*(?:AM|PM|am|pm)?\\b");
        java.util.regex.Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group().trim();
        }
        return null;
    }

    public static class EventExtraction {
        public String title;
        public String date;
        public String time;
        public String tag;
        public String description;
        public double confidence;
        public String sourceSnippet;
        public String url;
    }
}