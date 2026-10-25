package com.user.dto;

import com.user.entity.User;

public record RefreshTokenRotation(User user, String refreshToken) {
}
