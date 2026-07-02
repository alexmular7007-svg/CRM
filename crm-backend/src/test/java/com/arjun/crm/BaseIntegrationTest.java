package com.arjun.crm;

import com.arjun.crm.config.TestContainersConfiguration;
import com.arjun.crm.dto.request.LoginRequest;
import com.arjun.crm.dto.request.RegisterRequest;
import com.arjun.crm.entity.User;
import com.arjun.crm.enums.Role;
import com.arjun.crm.enums.UserStatus;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Base class for integration tests
 * Provides common setup and utilities
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestContainersConfiguration.class)
@Transactional
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected JwtService jwtService;

    @Autowired
    protected RedisTemplate<String, Object> redisTemplate;

    protected User testUser;
    protected String testUserToken;

    @BeforeEach
    public void baseSetUp() {
        // Clear Redis cache before each test
        redisTemplate.getConnectionFactory().getConnection().flushAll();
        
        // Create test user
        testUser = createTestUser("test@example.com", "Test User", "password123");
        testUserToken = generateToken(testUser);
    }

    /**
     * Create a test user
     */
    protected User createTestUser(String email, String fullName, String password) {
        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(Role.USER);
        user.setStatus(UserStatus.ACTIVE);
        return userRepository.save(user);
    }

    /**
     * Generate JWT token for a user
     */
    protected String generateToken(User user) {
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .build();
        return jwtService.generateToken(java.util.Map.of("userId", user.getId()), userDetails);
    }

    /**
     * Create register request
     * Note: Role is not set here - it defaults to USER on the backend
     */
    protected RegisterRequest createRegisterRequest(String email, String fullName, String password) {
        RegisterRequest request = new RegisterRequest();
        request.setEmail(email);
        request.setFullName(fullName);
        request.setPassword(password);
        // Role is NOT set during registration - backend always defaults to USER
        return request;
    }

    /**
     * Create login request
     */
    protected LoginRequest createLoginRequest(String email, String password) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }
}
