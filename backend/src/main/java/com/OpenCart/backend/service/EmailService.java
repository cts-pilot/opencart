package com.OpenCart.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public void sendPasswordResetEmail(String toEmail, String firstName, String resetLink, int validityMinutes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(fromAddress, "OpenCart");
            helper.setTo(toEmail);
            helper.setSubject("Reset your OpenCart password");
            helper.setText(buildHtmlBody(firstName, resetLink, validityMinutes), true);

            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    private String buildHtmlBody(String firstName, String resetLink, int validityMinutes) {
        String name = (firstName == null || firstName.isBlank()) ? "there" : firstName;
        return "<!doctype html>"
                + "<html><body style=\"margin:0;padding:0;background:#f5f5f5;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;\">"
                + "<div style=\"max-width:560px;margin:32px auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;\">"
                + "<div style=\"background:linear-gradient(135deg,#0f172a,#1e293b);padding:28px 32px;color:#fbbf24;\">"
                + "<h1 style=\"margin:0;font-size:22px;font-weight:700;\">OpenCart</h1>"
                + "<p style=\"margin:6px 0 0;color:#e2e8f0;font-size:13px;letter-spacing:0.4px;\">Password reset</p>"
                + "</div>"
                + "<div style=\"padding:28px 32px;\">"
                + "<p style=\"margin:0 0 14px;font-size:15px;\">Hi " + escape(name) + ",</p>"
                + "<p style=\"margin:0 0 18px;font-size:14.5px;line-height:1.6;color:#374151;\">"
                + "We got a request to reset the password on your OpenCart account. "
                + "Click the button below to set a new one. This link is valid for <b>" + validityMinutes + " minutes</b>."
                + "</p>"
                + "<p style=\"text-align:center;margin:24px 0;\">"
                + "<a href=\"" + escape(resetLink) + "\" "
                + "style=\"display:inline-block;padding:12px 26px;background:linear-gradient(135deg,#f59e0b,#d97706);"
                + "color:#0f172a;text-decoration:none;font-weight:700;border-radius:999px;font-size:14.5px;\">"
                + "Reset my password</a>"
                + "</p>"
                + "<p style=\"margin:14px 0 0;font-size:12.5px;color:#6b7280;line-height:1.6;\">"
                + "If the button doesn't work, paste this link into your browser:<br>"
                + "<span style=\"word-break:break-all;color:#b45309;\">" + escape(resetLink) + "</span>"
                + "</p>"
                + "<hr style=\"border:none;border-top:1px solid #e5e7eb;margin:24px 0;\">"
                + "<p style=\"margin:0;font-size:12.5px;color:#9ca3af;\">"
                + "Didn't request this? You can safely ignore this email — your password won't change."
                + "</p>"
                + "</div>"
                + "</div>"
                + "</body></html>";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}