package com.moneymind.service;

import com.moneymind.model.Transaction;
import com.moneymind.model.TransactionType;
import com.moneymind.model.User;
import com.moneymind.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class ForecastService {

    private final TransactionRepository transactionRepository;
    
    // Smoothing factor (alpha) between 0 and 1.
    // Higher alpha gives more weight to recent observations.
    private static final double ALPHA = 0.5;

    public ForecastService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    /**
     * Predicts the total expenses for the next month using Simple Exponential Smoothing.
     */
    public BigDecimal predictNextMonthExpenses(User user) {
        LocalDate sixMonthsAgo = LocalDate.now().minusMonths(6).withDayOfMonth(1);
        LocalDate today = LocalDate.now();

        List<Transaction> recentExpenses = transactionRepository.findByUserAndTypeAndDateBetween(
                user, TransactionType.EXPENSE, sixMonthsAgo, today);

        if (recentExpenses.isEmpty()) {
            return BigDecimal.ZERO;
        }

        // Group expenses by YearMonth
        Map<YearMonth, BigDecimal> monthlyTotals = new TreeMap<>();
        for (Transaction t : recentExpenses) {
            YearMonth ym = YearMonth.from(t.getDate());
            monthlyTotals.merge(ym, t.getAmount(), BigDecimal::add);
        }

        // Apply Simple Exponential Smoothing
        // Formula: F_{t+1} = \alpha * Y_t + (1 - \alpha) * F_t
        // We start with the first month's actual value as the initial forecast
        BigDecimal forecast = null;

        for (Map.Entry<YearMonth, BigDecimal> entry : monthlyTotals.entrySet()) {
            BigDecimal actual = entry.getValue();
            if (forecast == null) {
                forecast = actual;
            } else {
                BigDecimal term1 = actual.multiply(BigDecimal.valueOf(ALPHA));
                BigDecimal term2 = forecast.multiply(BigDecimal.valueOf(1 - ALPHA));
                forecast = term1.add(term2);
            }
        }

        return forecast.setScale(2, RoundingMode.HALF_UP);
    }
}
