
package com.user.dto;

public record AuthResponse(
	    Long id,
	    String username,
	    String email,
	    String message,
	    String accessToken,
        String refreshToken
	) {}