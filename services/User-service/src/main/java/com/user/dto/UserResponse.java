
package com.user.dto;

import com.user.entity.User;
import java.time.OffsetDateTime;

public record UserResponse(
        Long id,
        String username,
        String email,
        Long roleId,
        Boolean active,
        OffsetDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRoleId(),
                user.getActive(),
                user.getCreatedAt()
        );
    }
}