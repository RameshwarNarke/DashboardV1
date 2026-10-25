
package com.user.service;

import com.user.entity.RefreshToken;
import com.user.dto.RefreshTokenRotation;
import org.springframework.transaction.annotation.Transactional;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.user.JwtService;
import com.user.dto.AuthResponse;
import com.user.dto.LoginRequest;
import com.user.dto.RegisterRequest;
import com.user.entity.User;
import com.user.repository.UserRepository;
import com.user.entity.Role;
import com.user.repository.RoleRepository;

@Service
public class AuthService {

	private final UserRepository users;
	private final PasswordEncoder encoder;
	private final JwtService jwtService;
	private final RefreshTokenService refreshTokenService;
	private final RoleRepository roleRepository;

	public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwtService,
			RefreshTokenService refreshTokenService, RoleRepository roleRepository) {
		this.users = users;
		this.encoder = encoder;
		this.jwtService = jwtService;
		this.refreshTokenService = refreshTokenService;
		this.roleRepository = roleRepository;
	}

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		String username = request.username().trim();
		String email = request.email().trim().toLowerCase(Locale.ROOT);

		if (users.findByUsername(username).isPresent() || users.findByEmail(email).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Username or email already exists");
		}

		User user = new User();
		user.setUsername(username);
		user.setEmail(email);
		user.setPasswordHash(encoder.encode(request.password()));
		user.setRoleId(5L);
		user.setActive(true);

		User saved = users.save(user);

		return new AuthResponse(user.getId(), user.getUsername(), user.getEmail(), "Registration successful", null,
				null);
	}

	@Transactional
	public AuthResponse login(LoginRequest request) {
		User user = users.findByUsername(request.username().trim()).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

		if (!Boolean.TRUE.equals(user.getActive()) || !encoder.matches(request.password(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
		}

		String accessToken = jwtService.generateToken(user.getUsername(), getRoleName(user));
		String refreshToken = refreshTokenService.createRefreshToken(user);
		return new AuthResponse(user.getId(), user.getUsername(), user.getEmail(), "Registration successful",
				accessToken, refreshToken);
	}

	@Transactional
	public AuthResponse refresh(String rawRefreshToken) {
		if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is required");
		}

		try {
			RefreshTokenRotation rotation = refreshTokenService.rotateRefreshTokenAndGetUser(rawRefreshToken);

			User user = rotation.user();

			if (!Boolean.TRUE.equals(user.getActive())) {
				refreshTokenService.revokeRefreshToken(rotation.refreshToken());
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account is inactive");
			}

			String accessToken = jwtService.generateToken(user.getUsername(), getRoleName(user));

			return new AuthResponse(user.getId(), user.getUsername(), user.getEmail(), "Token refreshed successfully",
					accessToken, rotation.refreshToken());
		} catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
		}
	}

	@Transactional
	public void logout(String rawRefreshToken) {
		refreshTokenService.revokeRefreshToken(rawRefreshToken);
	}

	private String getRoleName(User user) {
		return roleRepository.findById(user.getRoleId()).map(Role::getName)
				.orElseThrow(() -> new IllegalStateException("Role not found for user ID: " + user.getId()));
	}

}