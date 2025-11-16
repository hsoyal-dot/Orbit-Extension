package com.orbit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.orbit.entity.Event;

public interface EventRepository extends JpaRepository<Event, Long>{}
