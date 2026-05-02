package com.moneymind.controller;

import com.moneymind.model.RecurringExpense;
import com.moneymind.model.User;
import com.moneymind.repository.RecurringExpenseRepository;
import com.moneymind.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring")
public class RecurringExpenseController {

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final UserRepository userRepository;

    public RecurringExpenseController(RecurringExpenseRepository recurringExpenseRepository, UserRepository userRepository) {
        this.recurringExpenseRepository = recurringExpenseRepository;
        this.userRepository = userRepository;
    }

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName()).orElseThrow();
    }

    @GetMapping
    public List<RecurringExpense> getAll(Authentication auth) {
        return recurringExpenseRepository.findByUser(getUser(auth));
    }

    @PostMapping
    public RecurringExpense create(@RequestBody RecurringExpense expense, Authentication auth) {
        expense.setUser(getUser(auth));
        return recurringExpenseRepository.save(expense);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        User user = getUser(auth);
        RecurringExpense expense = recurringExpenseRepository.findById(id).orElseThrow();

        if (!expense.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Acesso negado.");
        }

        recurringExpenseRepository.delete(expense);
        return ResponseEntity.ok("Despesa recorrente removida.");
    }
}
