package com.OpenCart.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles all RuntimeExceptions thrown from services.
     * Returns a clean JSON error body instead of a raw stack trace.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("error", ex.getMessage());

        // Map common error messages to appropriate HTTP status codes
        HttpStatus status;
        String message = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";

        if (message.contains("not found")) {
            status = HttpStatus.NOT_FOUND;
        } else if (message.contains("unauthorized") || message.contains("does not belong")) {
            status = HttpStatus.FORBIDDEN;
        } else if (message.contains("already registered") || message.contains("already in")) {
            status = HttpStatus.CONFLICT;
        } else if (message.contains("invalid email or password")) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (message.contains("empty")
                || message.contains("invalid")
                || message.contains("insufficient stock")) {
            status = HttpStatus.BAD_REQUEST;
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        body.put("status", status.value());
        return new ResponseEntity<>(body, status);
    }

}
