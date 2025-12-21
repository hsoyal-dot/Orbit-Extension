package com.orbit.controller;

import com.orbit.entity.Event;
import com.orbit.repository.EventRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class EventController {

    private final EventRepository repo;

    public EventController(EventRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/events")
    public List<Event> listEvents() {
        return repo.findAll();
    }

    @PostMapping("/saveEvent")
    public ResponseEntity<Event> saveEvent(@RequestBody Event ev) {
        Event saved = repo.save(ev);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id))
            return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/events/clear")
    public ResponseEntity<?> clearAll() {
        long count = repo.count();
        repo.deleteAll();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All events cleared",
                "count", count));
    }
}