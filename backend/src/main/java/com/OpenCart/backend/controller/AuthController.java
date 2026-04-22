package com.OpenCart.backend.controller;

import com.OpenCart.backend.model.User;
import com.OpenCart.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return userService.registerUser(user);
    }

    @PostMapping("/login")
    public String login(@RequestParam String email, @RequestParam String passwordHash) {
        User user = userService.loginUser(email, passwordHash);
        if (user != null) {
            return "Login successful for user: " + user.getName();
        }
        return "Invalid credentials!";
    }
}
