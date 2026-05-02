package com.moneymind.controller;

import com.moneymind.model.RecurringExpense;
import com.moneymind.model.User;
import com.moneymind.repository.RecurringExpenseRepository;
import com.moneymind.repository.UserRepository;
import com.moneymind.security.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RecurringExpenseRepository recurringExpenseRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
                          RecurringExpenseRepository recurringExpenseRepository,
                          PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.recurringExpenseRepository = recurringExpenseRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    // ─── Login ───────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.get("email"),
                        loginRequest.get("password")
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(loginRequest.get("email")).orElseThrow();

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("isConfigured", user.getConfigured());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        return ResponseEntity.ok(response);
    }

    // ─── Register ────────────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.get("email"))) {
            return ResponseEntity.badRequest().body("Email já está em uso!");
        }

        User user = new User();
        user.setName(signUpRequest.get("name"));
        user.setEmail(signUpRequest.get("email"));
        user.setPassword(passwordEncoder.encode(signUpRequest.get("password")));
        user.setConfigured(false);
        userRepository.save(user);

        return ResponseEntity.ok("Usuário registrado com sucesso!");
    }

    // ─── Get current user profile ─────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Map<String, Object> response = new HashMap<>();
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("salary", user.getSalary());
        response.put("initialBalance", user.getInitialBalance());
        response.put("isConfigured", user.getConfigured());
        response.put("autoAddSalary", Boolean.TRUE.equals(user.getAutoAddSalary()));
        response.put("extraCategories", user.getExtraCategories());
        return ResponseEntity.ok(response);
    }

    // ─── Save / update user settings ─────────────────────────────────
    @PutMapping("/configure")
    public ResponseEntity<?> configureSettings(@RequestBody Map<String, Object> configRequest,
                                               Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();

        if (configRequest.containsKey("salary")) {
            user.setSalary(new BigDecimal(configRequest.get("salary").toString()));
        }

        if (configRequest.containsKey("initialBalance")) {
            user.setInitialBalance(new BigDecimal(configRequest.get("initialBalance").toString()));
        }

        if (configRequest.containsKey("extraCategories")) {
            List<String> categories = (List<String>) configRequest.get("extraCategories");
            user.setExtraCategories(categories);
        }

        boolean newAutoAdd = configRequest.containsKey("autoAddSalary")
                && Boolean.TRUE.equals(configRequest.get("autoAddSalary"));
        boolean wasAutoAdd = Boolean.TRUE.equals(user.getAutoAddSalary());

        user.setAutoAddSalary(newAutoAdd);

        // Toggled ON → create recurring salary entry (only if not already existing)
        if (newAutoAdd && !wasAutoAdd && user.getSalary().compareTo(BigDecimal.ZERO) > 0) {
            RecurringExpense r = new RecurringExpense();
            r.setName("Salário (Automático)");
            r.setAmount(user.getSalary());
            r.setCategory("Salário");
            r.setFrequency("MONTHLY_INCOME");
            r.setNextDueDate(LocalDate.now().plusMonths(1).withDayOfMonth(1));
            r.setUser(user);
            recurringExpenseRepository.save(r);
        }

        // Toggled OFF → remove existing recurring salary entries
        if (!newAutoAdd && wasAutoAdd) {
            recurringExpenseRepository.findByUser(user).stream()
                    .filter(r -> "MONTHLY_INCOME".equals(r.getFrequency()))
                    .forEach(recurringExpenseRepository::delete);
        }

        user.setConfigured(true);
        userRepository.save(user);
        return ResponseEntity.ok("Configurações salvas com sucesso!");
    }
}
