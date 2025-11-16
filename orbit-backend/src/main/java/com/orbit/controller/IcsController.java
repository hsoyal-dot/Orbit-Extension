package com.orbit.controller;

import com.orbit.entity.Event;
import com.orbit.repository.EventRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class IcsController {

  private final EventRepository repo;
  private static final DateTimeFormatter DATEFMT = DateTimeFormatter.ofPattern("yyyyMMdd");

  public IcsController(EventRepository repo) { this.repo = repo; }

  @GetMapping("/export/ics")
  public ResponseEntity<String> exportIcs() {
    List<Event> events = repo.findAll();
    StringBuilder sb = new StringBuilder();
    sb.append("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Orbit//EN\r\n");
    for (Event e : events) {
      sb.append("BEGIN:VEVENT\r\n");
      String uid = UUID.randomUUID().toString();
      sb.append("UID:").append(uid).append("\r\n");
      sb.append("SUMMARY:").append(escape(e.getTitle())).append("\r\n");
      if (e.getDate() != null && !e.getDate().isBlank()) {
        // assume YYYY-MM-DD
        String d = e.getDate();
        try {
          LocalDate ld = LocalDate.parse(d);
          sb.append("DTSTART;VALUE=DATE:").append(ld.format(DATEFMT)).append("\r\n");
        } catch (Exception ex) {}
      }
      sb.append("DESCRIPTION:").append(escape(e.getSourceSnippet()==null?"":e.getSourceSnippet())).append("\r\n");
      if (e.getUrl()!=null) sb.append("URL:").append(e.getUrl()).append("\r\n");
      sb.append("END:VEVENT\r\n");
    }
    sb.append("END:VCALENDAR\r\n");

    return ResponseEntity.ok()
      .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"orbit-events.ics\"")
      .contentType(MediaType.parseMediaType("text/calendar"))
      .body(sb.toString());
  }

  private static String escape(String s) {
    if (s == null) return "";
    return s.replace("\n", "\\n").replace("\r", "\\r").replace(";", "\\;").replace(",", "\\,");
  }
}