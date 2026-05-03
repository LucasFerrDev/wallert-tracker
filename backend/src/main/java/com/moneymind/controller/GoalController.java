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

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Goal updatedGoal, Authentication auth) {
        User user = getUser(auth);
        Goal existingGoal = goalRepository.findByIdAndUser(id, user)
                .orElse(null);
        if (existingGoal == null) return ResponseEntity.status(404).body("Meta não encontrada.");

        existingGoal.setName(updatedGoal.getName());
        existingGoal.setTargetAmount(updatedGoal.getTargetAmount());
        existingGoal.setCurrentAmount(updatedGoal.getCurrentAmount());
        existingGoal.setDeadline(updatedGoal.getDeadline());

        goalRepository.save(existingGoal);
        return ResponseEntity.ok(existingGoal);
    }

    @PutMapping("/{id}/deposit")
    public ResponseEntity<?> deposit(@PathVariable Long id, @RequestBody Map<String, Double> body, Authentication auth) {
        User user = getUser(auth);
        Goal goal = goalRepository.findByIdAndUser(id, user)
                .orElse(null);
        if (goal == null) return ResponseEntity.status(404).body("Meta não encontrada.");

        double amount = body.getOrDefault("amount", 0.0);
        goal.setCurrentAmount(goal.getCurrentAmount().add(java.math.BigDecimal.valueOf(amount)));
        goalRepository.save(goal);
        return ResponseEntity.ok(goal);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        User user = getUser(auth);
        Goal goal = goalRepository.findByIdAndUser(id, user)
                .orElse(null);
        if (goal == null) return ResponseEntity.status(404).body("Meta não encontrada.");

        goalRepository.delete(goal);
        return ResponseEntity.ok("Meta removida.");
    }
}
