package com.OpenCart.backend.repository;

import com.OpenCart.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findBySellerSellerId(Long sellerId);
    List<Product> findByCategoryCategoryId(Long categoryId);
}
