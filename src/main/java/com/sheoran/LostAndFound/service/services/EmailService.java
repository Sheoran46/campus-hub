package com.sheoran.LostAndFound.service.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Async
    public void sendVerificationEmail(String to, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("CampusHub Email Verification");
        message.setText("Thank you for registering. Please click the link below to verify your email address:\n"
                + "http://localhost:8080/api/auth/verify?token=" + token);
        mailSender.send(message);
    }

    @Async
    public void sendNotificationEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("CampusHub Notification: " + subject);
        message.setText(text);
        mailSender.send(message);
    }
}