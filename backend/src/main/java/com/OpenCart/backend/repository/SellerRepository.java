package com.OpenCart.backend.repository;

import com.OpenCart.backend.model.Seller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<Seller, Long> {
    Optional<Seller> findByUserUserId(String userId);
    boolean existsByUserUserId(String userId);
}
