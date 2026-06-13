package com.sheoran.LostAndFound;

import com.sheoran.LostAndFound.model.Role;
import com.sheoran.LostAndFound.model.entities.User;
import com.sheoran.LostAndFound.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableAsync // Enable background processing for emails and AI tasks
public class LostAndFoundApplication {

	public static void main(String[] args) {
		SpringApplication.run(LostAndFoundApplication.class, args);
	}

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Check if admin user exists, if not, create one
            if (userRepository.findByEmail("admin@campushub.com").isEmpty()) {
                User adminUser = User.builder()
                        .name("Campus Admin")
                        .email("admin@campushub.com")
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .role(Role.ADMIN)
                        .isVerified(true)
                        .unpaidFines(0.0)
                        .build();
                userRepository.save(adminUser);
                System.out.println("Default Admin Account Created!");
            }
        };
    }
}