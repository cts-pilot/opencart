package com.OpenCart.backend.dto;

public class AuthResponse {
    private String token;
    private String userId;
    private String email;
    private String firstName;
    private String lastName;
    private String role;

    public AuthResponse(String token, String userId, String email,
                        String firstName, String lastName, String role) {
        this.token     = token;
        this.userId    = userId;
        this.email     = email;
        this.firstName = firstName;
        this.lastName  = lastName;
        this.role      = role;
    }

    public String getToken()     { return token; }
    public String getUserId()    { return userId; }
    public String getEmail()     { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName()  { return lastName; }
    public String getRole()      { return role; }
}
