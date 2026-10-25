package com.user.service;

import com.user.entity.Role;
import org.springframework.stereotype.Service;
import java.util.List;
import com.user.repository.RoleRepository;

@Service
public class RoleService {

	private final RoleRepository roleRepository;

	public RoleService(RoleRepository roleRepository) {
		this.roleRepository = roleRepository;
	}

	public List<Role> getAllRoles() {
		return roleRepository.findAll();
	}
}