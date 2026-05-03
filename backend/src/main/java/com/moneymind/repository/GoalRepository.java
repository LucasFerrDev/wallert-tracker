package com.moneymind.repository;

import com.moneymind.model.Goal;
import com.moneymind.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUser(User user);
    Optional<Goal> findByIdAndUser(Long id, User user);
}
