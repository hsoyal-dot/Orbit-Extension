package com.orbit.entity;

import jakarta.persistence.*;
// import java.time.LocalDateTime;

@Entity
@Table(name = "events")
public class Event {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String title;
  private String date; // YYYY-MM-DD
  private String time; // HH:mm
  private String tag;
  private Double confidence;
  @Column(length = 2000)
  private String sourceSnippet;
  private String url;
//   private LocalDateTime createdAt = LocalDateTime.now();

  // getters & setters omitted for brevity (use Lombok or generate)
  // ...
  public Long getId() { return id; }
  public void setId(Long id) { this.id=id; }
  public String getTitle(){ return title; }
  public void setTitle(String t){ this.title = t; }
  public String getDate(){ return date; }
  public void setDate(String d){ this.date = d; }
  public String getTime(){ return time; }
  public void setTime(String t){ this.time = t; }
  public String getTag(){ return tag; }
  public void setTag(String tag){ this.tag = tag; }
  public Double getConfidence(){ return confidence; }
  public void setConfidence(Double c){ this.confidence = c; }
  public String getSourceSnippet(){ return sourceSnippet; }
  public void setSourceSnippet(String s){ this.sourceSnippet = s; }
  public String getUrl(){ return url; }
  public void setUrl(String u){ this.url = u; }
}