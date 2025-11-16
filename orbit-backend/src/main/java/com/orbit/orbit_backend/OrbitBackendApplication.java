package com.orbit.orbit_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.orbit")
@EnableJpaRepositories(basePackages = "com.orbit.repository")
@EntityScan(basePackages = "com.orbit.entity")
public class OrbitBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(OrbitBackendApplication.class, args);
	}

}
