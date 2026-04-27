package com.OpenCart.backend.service;

import com.OpenCart.backend.model.User;

public interface UserService {
    User registerUser(User user);
    User loginUser(String email, String passwordHash);
}
