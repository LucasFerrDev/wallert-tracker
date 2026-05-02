package com.moneymind.service;

import com.moneymind.model.RecurringExpense;
import com.moneymind.model.Transaction;
import com.moneymind.model.TransactionType;
import com.moneymind.repository.RecurringExpenseRepository;
import com.moneymind.repository.TransactionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class RecurringSchedulerService {

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final TransactionRepository transactionRepository;

    public RecurringSchedulerService(RecurringExpenseRepository recurringExpenseRepository,
                                     TransactionRepository transactionRepository) {
        this.recurringExpenseRepository = recurringExpenseRepository;
        this.transactionRepository = transactionRepository;
    }

    /**
     * Runs every day at 06:00 AM.
     * Checks all recurring entries that are due today or overdue,
     * creates the corresponding transaction and advances to the next occurrence.
     */
    @Scheduled(cron = "0 0 6 * * *")
    @Transactional
    public void processRecurring() {
        LocalDate today = LocalDate.now();

        // Fetch ALL recurring entries due up to and including today
        List<RecurringExpense> allDue = recurringExpenseRepository.findAll().stream()
                .filter(r -> r.getNextDueDate() != null && !r.getNextDueDate().isAfter(today))
                .toList();

        for (RecurringExpense recurring : allDue) {
            boolean isIncome = "MONTHLY_INCOME".equals(recurring.getFrequency());

            Transaction transaction = new Transaction();
            transaction.setDescription(recurring.getName());
            transaction.setAmount(recurring.getAmount());
            transaction.setDate(today);
            transaction.setType(isIncome ? TransactionType.INCOME : TransactionType.EXPENSE);
            transaction.setCategory(recurring.getCategory());
            transaction.setUser(recurring.getUser());

            transactionRepository.save(transaction);

            // Advance nextDueDate to the next occurrence
            LocalDate nextDate = switch (recurring.getFrequency()) {
                case "MONTHLY", "MONTHLY_INCOME" -> recurring.getNextDueDate().plusMonths(1).withDayOfMonth(1);
                case "WEEKLY"  -> recurring.getNextDueDate().plusWeeks(1);
                case "YEARLY"  -> recurring.getNextDueDate().plusYears(1);
                default        -> recurring.getNextDueDate().plusMonths(1);
            };

            recurring.setNextDueDate(nextDate);
            recurringExpenseRepository.save(recurring);
        }
    }
}
