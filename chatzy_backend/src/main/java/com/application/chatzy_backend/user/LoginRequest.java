package com.application.chatzy_backend.user;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}
