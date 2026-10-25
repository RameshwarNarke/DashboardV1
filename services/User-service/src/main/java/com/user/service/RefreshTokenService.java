
package com.user.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.user.entity.RefreshToken;
import com.user.dto.RefreshTokenRotation;
import com.user.entity.User;
import com.user.repository.RefreshTokenRepository;

@Service
public class RefreshTokenService {

	private final RefreshTokenRepository refreshTokenRepository;
	private final long refreshTokenDays;
	private final SecureRandom secureRandom = new SecureRandom();

	public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
			@Value("${security.jwt.refresh-token-days:7}") long refreshTokenDays) {
		this.refreshTokenRepository = refreshTokenRepository;
		this.refreshTokenDays = refreshTokenDays;
	}

	@Transactional
	public String createRefreshToken(User user) {
		byte[] bytes = new byte[32];
		secureRandom.nextBytes(bytes);

		String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

		RefreshToken token = new RefreshToken(user, hashToken(rawToken),
				Instant.now().plus(refreshTokenDays, ChronoUnit.DAYS));

		refreshTokenRepository.save(token);
		return rawToken;
	}

	@Transactional
	public String rotateRefreshToken(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			throw new IllegalArgumentException("Refresh token is required");
		}

		RefreshToken oldToken = refreshTokenRepository.findByTokenHashForUpdate(hashToken(rawToken))
				.orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

		Instant now = Instant.now();

		if (!oldToken.isUsableAt(now)) {
			throw new IllegalArgumentException("Refresh token is expired or revoked");
		}

		User user = oldToken.getUser();

		oldToken.revoke(now);
		refreshTokenRepository.flush();

		return createRefreshToken(user);
	}

	@Transactional
	public void revokeRefreshToken(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			return;
		}

		refreshTokenRepository.findByTokenHashForUpdate(hashToken(rawToken))
				.filter(token -> token.getRevokedAt() == null).ifPresent(token -> token.revoke(Instant.now()));
	}

	private String hashToken(String token) {
		try {
			byte[] hash = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));

			return HexFormat.of().formatHex(hash);
		} catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is unavailable", ex);
		}
	}

	@Transactional
	public RefreshTokenRotation rotateRefreshTokenAndGetUser(String rawToken) {

		if (rawToken == null || rawToken.isBlank()) {
			throw new IllegalArgumentException("Refresh token is required");
		}

		String tokenHash = hashToken(rawToken);

		RefreshToken oldToken = refreshTokenRepository.findByTokenHashForUpdate(tokenHash)
				.orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

		Instant now = Instant.now();

		if (!oldToken.isUsableAt(now)) {
			throw new IllegalArgumentException("Refresh token is expired or revoked");
		}

		User user = oldToken.getUser();

		oldToken.revoke(now);
		refreshTokenRepository.flush();

		String newRefreshToken = createRefreshToken(user);

		return new RefreshTokenRotation(user, newRefreshToken);
	}
}
