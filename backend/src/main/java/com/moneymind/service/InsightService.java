package com.moneymind.service;

import com.moneymind.model.User;
import com.moneymind.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InsightService {

    private final TransactionRepository transactionRepository;

    public InsightService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<String> generateCategoryInsights(User user) {
        List<String> insights = new ArrayList<>();

        // Compare the two most recent fully closed months.
        // Using the current month can hide trends because the month is still incomplete.
        YearMonth recentCompleteMonth = YearMonth.now().minusMonths(1);
        YearMonth previousCompleteMonth = recentCompleteMonth.minusMonths(1);

        List<Object[]> recentCategoryTotals = transactionRepository.sumAmountByCategoryAndDateBetween(
                user,
                recentCompleteMonth.atDay(1),
                recentCompleteMonth.atEndOfMonth()
        );

        List<Object[]> previousCategoryTotals = transactionRepository.sumAmountByCategoryAndDateBetween(
                user,
                previousCompleteMonth.atDay(1),
                previousCompleteMonth.atEndOfMonth()
        );

        Map<String, BigDecimal> recentMap = mapTotals(recentCategoryTotals);
        Map<String, BigDecimal> previousMap = mapTotals(previousCategoryTotals);

        for (Map.Entry<String, BigDecimal> entry : recentMap.entrySet()) {
            String category = entry.getKey();
            BigDecimal currentAmount = entry.getValue();
            BigDecimal lastAmount = previousMap.getOrDefault(category, BigDecimal.ZERO);

            if (lastAmount.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal increase = currentAmount.subtract(lastAmount);
                if (increase.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal percentage = increase.divide(lastAmount, 2, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
                    if (percentage.compareTo(BigDecimal.valueOf(15)) > 0) { // Highlight if > 15% increase
                        insights.add(String.format("Você gastou %s%% a mais com %s no último mês completo em comparação ao mês anterior.", percentage.intValue(), category));
                    }
                }
            }
        }

        if (insights.isEmpty()) {
            insights.add("Seus gastos estão sob controle. Nenhuma categoria teve aumento significativo.");
        }

        return insights;
    }

    private Map<String, BigDecimal> mapTotals(List<Object[]> totals) {
        Map<String, BigDecimal> map = new HashMap<>();
        for (Object[] total : totals) {
            String category = (String) total[0];
            BigDecimal amount = (BigDecimal) total[1];
            map.put(category != null ? category : "Outros", amount);
        }
        return map;
    }
}
