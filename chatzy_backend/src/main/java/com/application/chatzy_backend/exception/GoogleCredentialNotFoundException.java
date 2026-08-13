package com.application.chatzy_backend.exception;

public class GoogleCredentialNotFoundException extends RuntimeException {
    public GoogleCredentialNotFoundException(String message) {
        super(message);
    }

    public GoogleCredentialNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}

