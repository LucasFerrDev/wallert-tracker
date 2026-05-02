package com.moneymind.service;

import com.moneymind.model.User;
import com.moneymind.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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
        
        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(today);
        YearMonth lastMonth = currentMonth.minusMonths(1);

        LocalDate startCurrent = currentMonth.atDay(1);
        LocalDate endCurrent = currentMonth.atEndOfMonth();

        LocalDate startLast = lastMonth.atDay(1);
        LocalDate endLast = lastMonth.atEndOfMonth();

        List<Object[]> currentCategoryTotals = transactionRepository.sumAmountByCategoryAndDateBetween(user, startCurrent, endCurrent);
        List<Object[]> lastCategoryTotals = transactionRepository.sumAmountByCategoryAndDateBetween(user, startLast, endLast);

        Map<String, BigDecimal> currentMap = mapTotals(currentCategoryTotals);
        Map<String, BigDecimal> lastMap = mapTotals(lastCategoryTotals);

        for (Map.Entry<String, BigDecimal> entry : currentMap.entrySet()) {
            String category = entry.getKey();
            BigDecimal currentAmount = entry.getValue();
            BigDecimal lastAmount = lastMap.getOrDefault(category, BigDecimal.ZERO);

            if (lastAmount.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal increase = currentAmount.subtract(lastAmount);
                if (increase.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal percentage = increase.divide(lastAmount, 2, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
                    if (percentage.compareTo(BigDecimal.valueOf(15)) > 0) { // Highlight if > 15% increase
                        insights.add(String.format("Você gastou %s%% a mais com %s esse mês em comparação ao mês passado.", percentage.intValue(), category));
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
