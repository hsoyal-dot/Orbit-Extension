package com.orbit.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.stereotype.Controller;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Controller
@RequestMapping("/api/auth")
public class AuthController {

  @Value("${google.clientId:}")
  private String clientId;

  @Value("${google.redirectUri:}")
  private String redirectUri;

  @GetMapping("/google")
  public void startAuth(HttpServletResponse resp) throws IOException {
    String authUrl = "https://accounts.google.com/o/oauth2/v2/auth" +
        "?response_type=code" +
        "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
        "&scope=" + URLEncoder.encode("https://www.googleapis.com/auth/calendar.events", StandardCharsets.UTF_8) +
        "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
        "&access_type=offline" +
        "&prompt=consent";
    resp.sendRedirect(authUrl);
  }

  @GetMapping("/google/callback")
  public String callback(@RequestParam("code") String code) {
    // Exchange code for tokens: server-side call (implement in
    // GoogleCalendarService)
    // After exchange, redirect to a success page or close the tab.
    return "redirect:/auth-success.html";
  }
}