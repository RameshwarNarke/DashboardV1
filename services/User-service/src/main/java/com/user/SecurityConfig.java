
package com.user;

import java.util.List;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.Collection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

		http.cors(Customizer.withDefaults()).csrf(csrf -> csrf.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login", "/api/auth/refresh",
								"/api/auth/logout")
						.permitAll()

						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

						// Admin-only operations
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.GET, "/api/users")
					    .hasRole("ADMIN")

						// Audit read access for admins and auditors
						.requestMatchers(HttpMethod.GET, "/api/audit/**").hasAnyRole("ADMIN", "AUDITOR")

						// Other authenticated endpoints
						.anyRequest().authenticated())

				.oauth2ResourceServer(
						oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));

		return http.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();

		config.setAllowedOrigins(List.of("http://localhost:4200"));

		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

		config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));

		config.setAllowCredentials(false);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

		source.registerCorsConfiguration("/**", config);

		return source;
	}

	public Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter() {
		return jwt -> {
			String role = jwt.getClaimAsString("role");

			Collection<SimpleGrantedAuthority> authorities = role == null || role.isBlank() ? List.of()
					: List.of(new SimpleGrantedAuthority("ROLE_" + role));

			return new JwtAuthenticationToken(jwt, authorities);
		};
	}
}