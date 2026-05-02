package com.moneymind.repository;

import com.moneymind.model.RecurringExpense;
import com.moneymind.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RecurringExpenseRepository extends JpaRepository<RecurringExpense, Long> {

    List<RecurringExpense> findByUserAndNextDueDateBefore(User user, LocalDate date);
    
    List<RecurringExpense> findByUser(User user);
}
