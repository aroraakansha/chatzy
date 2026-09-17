package com.application.chatzy_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ChatzyBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ChatzyBackendApplication.class, args);
	}

}
