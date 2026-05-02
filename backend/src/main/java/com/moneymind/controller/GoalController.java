package com.moneymind.controller;

import com.moneymind.model.Goal;
import com.moneymind.model.User;
import com.moneymind.repository.GoalRepository;
import com.moneymind.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public GoalController(GoalRepository goalRepository, UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
    }

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName()).orElseThrow();
    }

    @GetMapping
    public List<Goal> getAll(Authentication auth) {
        return goalRepository.findByUser(getUser(auth));
    }

    @PostMapping
    public Goal create(@RequestBody Goal goal, Authentication auth) {
        goal.setUser(getUser(auth));
        return goalRepository.save(goal);
    }

    @PutMapping("/{id}/deposit")
    public ResponseEntity<?> deposit(@PathVariable Long id, @RequestBody Map<String, Double> body, Authentication auth) {
        User user = getUser(auth);
        Goal goal = goalRepository.findById(id).orElseThrow();

        if (!goal.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Acesso negado.");
        }

        double amount = body.getOrDefault("amount", 0.0);
        goal.setCurrentAmount(goal.getCurrentAmount().add(java.math.BigDecimal.valueOf(amount)));
        goalRepository.save(goal);
        return ResponseEntity.ok(goal);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        User user = getUser(auth);
        Goal goal = goalRepository.findById(id).orElseThrow();

        if (!goal.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Acesso negado.");
        }

        goalRepository.delete(goal);
        return ResponseEntity.ok("Meta removida.");
    }
}
