package com.application.chatzy_backend.config;

import com.application.chatzy_backend.user.User;
import com.application.chatzy_backend.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("admin@chatzy.app").isEmpty()) {
            User admin = new User();
            admin.setEmail("admin@chatzy.app");
            admin.setDisplayName("System Admin");

            // ADD THIS LINE
            admin.setUsername("admin_user");

            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            userRepository.save(admin);
        }

    }
}
