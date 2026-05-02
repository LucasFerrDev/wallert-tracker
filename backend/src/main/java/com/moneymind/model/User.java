package com.moneymind.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor  // Only NoArgsConstructor — default field values are respected
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private BigDecimal salary = BigDecimal.ZERO;

    private BigDecimal initialBalance = BigDecimal.ZERO;

    private Boolean autoAddSalary = false;

    // Use Boolean (wrapper) + explicit @Column name to avoid Lombok getter conflict
    // Jackson will serialise this as "isConfigured" due to @JsonProperty
    @Column(name = "is_configured", nullable = false)
    @JsonProperty("isConfigured")
    private Boolean configured = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_extra_categories", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "category")
    private List<String> extraCategories = new ArrayList<>();
}
