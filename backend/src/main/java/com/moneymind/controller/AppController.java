package com.moneymind.controller;

import com.moneymind.model.Transaction;
import com.moneymind.model.TransactionType;
import com.moneymind.model.User;
import com.moneymind.repository.TransactionRepository;
import com.moneymind.repository.UserRepository;
import com.moneymind.service.ForecastService;
import com.moneymind.service.InsightService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;

@RestController
@RequestMapping("/api")
public class AppController {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final ForecastService forecastService;
    private final InsightService insightService;

    public AppController(TransactionRepository transactionRepository, UserRepository userRepository,
                         ForecastService forecastService, InsightService insightService) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.forecastService = forecastService;
        this.insightService = insightService;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName()).orElseThrow();
    }

    // ─── Transactions ────────────────────────────────────────────────
    @GetMapping("/transactions")
    public List<Transaction> getAllTransactions(Authentication authentication) {
        return transactionRepository.findByUser(getAuthenticatedUser(authentication));
    }

    @PostMapping("/transactions")
    public Transaction createTransaction(@RequestBody Transaction transaction, Authentication authentication) {
        transaction.setUser(getAuthenticatedUser(authentication));
        return transactionRepository.save(transaction);
    }

    @PutMapping("/transactions/{id}")
    public ResponseEntity<?> updateTransaction(@PathVariable Long id, @RequestBody Transaction updatedTransaction, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Optional<Transaction> existingOpt = transactionRepository.findByIdAndUser(id, user);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Transação não encontrada.");
        }
        Transaction existing = existingOpt.get();

        existing.setDescription(updatedTransaction.getDescription());
        existing.setAmount(updatedTransaction.getAmount());
        existing.setDate(updatedTransaction.getDate());
        existing.setType(updatedTransaction.getType());
        existing.setCategory(updatedTransaction.getCategory());

        return ResponseEntity.ok(transactionRepository.save(existing));
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<?> deleteTransaction(@PathVariable Long id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Optional<Transaction> txOpt = transactionRepository.findByIdAndUser(id, user);
        if (txOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Transação não encontrada.");
        }
        Transaction tx = txOpt.get();
        transactionRepository.delete(tx);
        return ResponseEntity.ok("Transação removida.");
    }

    // ─── Dashboard Summary ───────────────────────────────────────────
    @GetMapping("/dashboard/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        List<Transaction> allTx = transactionRepository.findByUser(user);

        // Calculate real balance: initialBalance + Σ INCOME - Σ EXPENSE
        BigDecimal balance = allTx.stream()
                .map(tx -> tx.getType() == TransactionType.INCOME
                        ? tx.getAmount()
                        : tx.getAmount().negate())
                .reduce(user.getInitialBalance() != null ? user.getInitialBalance() : BigDecimal.ZERO,
                        BigDecimal::add);

        BigDecimal forecast = forecastService.predictNextMonthExpenses(user);
        List<String> insights = insightService.generateCategoryInsights(user);

        // Build last-6-months chart data
        List<Map<String, Object>> chartData = buildChartData(user);

        Map<String, Object> summary = new HashMap<>();
        summary.put("currentBalance", balance);
        summary.put("forecast", forecast);
        summary.put("insights", insights);
        summary.put("chartData", chartData);

        return ResponseEntity.ok(summary);
    }

    /**
     * Groups expenses by month for the last 6 months, returns chart-ready list.
     */
    private List<Map<String, Object>> buildChartData(User user) {
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(today.minusMonths(i));
            LocalDate start = ym.atDay(1);
            LocalDate end = ym.atEndOfMonth();

            List<Transaction> monthTx = transactionRepository.findByUserAndTypeAndDateBetween(
                    user, TransactionType.EXPENSE, start, end);

            BigDecimal total = monthTx.stream()
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String monthLabel = ym.getMonth()
                    .getDisplayName(TextStyle.SHORT, new Locale("pt", "BR"));
            // Capitalize first letter
            monthLabel = Character.toUpperCase(monthLabel.charAt(0)) + monthLabel.substring(1);

            Map<String, Object> point = new HashMap<>();
            point.put("month", monthLabel);
            point.put("total", total);
            result.add(point);
        }
        return result;
    }
}
