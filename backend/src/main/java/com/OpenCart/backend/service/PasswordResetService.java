package com.OpenCart.backend.service;

import com.OpenCart.backend.dto.ForgotPasswordRequest;
import com.OpenCart.backend.dto.ResetPasswordRequest;
import com.OpenCart.backend.model.PasswordResetToken;
import com.OpenCart.backend.model.User;
import com.OpenCart.backend.repository.PasswordResetTokenRepository;
import com.OpenCart.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordResetTokenRepository tokenRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;

    @Value("${app.password-reset.token-validity-minutes:30}")
    private int tokenValidityMinutes;

    @Value("${app.password-reset.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    /**
     * Generate a reset token and email it. Always returns successfully
     * (even when the email isn't registered) so we don't leak which
     * emails exist.
     */
    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest req) {
        if (req == null || req.getEmail() == null || req.getEmail().isBlank()) {
            throw new RuntimeException("Email is required");
        }

        String email = req.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for unknown email: {}", email);
            return; // silently succeed
        }

        User user = userOpt.get();

        // Invalidate any previous tokens for this user
        tokenRepository.deleteByUserId(user.getUserId());

        String rawToken = generateToken();
        PasswordResetToken token = new PasswordResetToken();
        token.setToken(rawToken);
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(tokenValidityMinutes));
        tokenRepository.save(token);

        String resetLink = frontendUrl + "/reset-password?token=" + rawToken;

        // Log the link prominently so it's usable for testing even when SMTP
        // is blocked by the corporate network. The token is single-use and
        // short-lived so console-logging it during development is acceptable.
        log.info("\n=============== PASSWORD RESET LINK ===============\n  to:    {}\n  link:  {}\n  valid: {} minutes\n===================================================",
                user.getEmail(), resetLink, tokenValidityMinutes);

        try {
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), resetLink, tokenValidityMinutes);
        } catch (RuntimeException ex) {
            log.warn("SMTP send failed for {} — falling back to console link only. Reason: {}",
                    user.getEmail(), ex.getMessage());
        }
    }

    /**
     * Verify the token and update the password. Token is single-use.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        if (req == null || req.getToken() == null || req.getToken().isBlank()) {
            throw new RuntimeException("Reset token is required");
        }
        if (req.getNewPassword() == null || req.getNewPassword().length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters long");
        }

        PasswordResetToken token = tokenRepository.findByToken(req.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset link"));

        if (token.isUsed()) {
            throw new RuntimeException("This reset link has already been used");
        }
        if (token.isExpired()) {
            throw new RuntimeException("This reset link has expired. Please request a new one.");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);
    }

    private String generateToken() {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}