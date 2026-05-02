package com.moneymind.repository;

import com.moneymind.model.Transaction;
import com.moneymind.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.moneymind.model.User;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserAndDateBetween(User user, LocalDate startDate, LocalDate endDate);
    
    List<Transaction> findByUserAndTypeAndDateBetween(User user, TransactionType type, LocalDate startDate, LocalDate endDate);

    @Query("SELECT t.category, SUM(t.amount) FROM Transaction t WHERE t.user = :user AND t.type = 'EXPENSE' AND t.date BETWEEN :startDate AND :endDate GROUP BY t.category")
    List<Object[]> sumAmountByCategoryAndDateBetween(User user, LocalDate startDate, LocalDate endDate);
    
    List<Transaction> findByUser(User user);

    Optional<Transaction> findByIdAndUser(Long id, User user);
}
