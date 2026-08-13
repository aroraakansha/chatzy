package com.application.chatzy_backend.auth.dto;

import com.application.chatzy_backend.user.User;

public class AuthResponse {
    private String token;
    private String message;
    private UserDto user;

    public AuthResponse(String token, String message, User user) {
        this.token = token;
        this.message = message;
        this.user = new UserDto(user);
    }

    // Getters
    public String getToken() { return token; }
    public String getMessage() { return message; }
    public UserDto getUser() { return user; }

    /** Only return the profile data the browser needs; never expose password or OAuth tokens. */
    public static class UserDto {
        private final String id;
        private final String name;
        private final String email;
        private final String phone;

        public UserDto(User user) {
            this.id = user.getId().toString();
            this.name = user.getDisplayName();
            this.email = user.getEmail();
            this.phone = user.getPhone();
        }

        public String getId() { return id; }
        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getPhone() { return phone; }
    }
}
