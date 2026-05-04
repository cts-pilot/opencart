package com.OpenCart.backend.controller;

import com.OpenCart.backend.model.Category;
import com.OpenCart.backend.model.Product;
import com.OpenCart.backend.model.Review;
import com.OpenCart.backend.service.ProductBrowseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  BASE PATH : /api/products  and  /api/categories               │
 * │  ACCESS    : PUBLIC — no JWT required                           │
 * │  PURPOSE   : Product and category browsing for all visitors     │
 * └─────────────────────────────────────────────────────────────────┘
 */
@RestController
public class ProductBrowseController {

    @Autowired
    private ProductBrowseService productBrowseService;

    // ═══════════════════════════════════════════════════════════════
    //  PRODUCTS
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/products
     * Returns all products across all sellers.
     */
    @GetMapping("/api/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productBrowseService.getAllProducts());
    }

    /**
     * GET /api/products/{productId}
     * Returns a single product by ID.
     */
    @GetMapping("/api/products/{productId}")
    public ResponseEntity<Product> getProductById(@PathVariable Long productId) {
        return ResponseEntity.ok(productBrowseService.getProductById(productId));
    }

    /**
     * GET /api/products/category/{categoryId}
     * Returns all products in a given category.
     */
    @GetMapping("/api/products/category/{categoryId}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(productBrowseService.getProductsByCategory(categoryId));
    }

    /**
     * GET /api/products/{productId}/reviews
     * Returns all reviews for a product.
     */
    @GetMapping("/api/products/{productId}/reviews")
    public ResponseEntity<List<Review>> getProductReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(productBrowseService.getReviewsForProduct(productId));
    }

    // ═══════════════════════════════════════════════════════════════
    //  CATEGORIES
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/categories
     * Returns all available categories.
     */
    @GetMapping("/api/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(productBrowseService.getAllCategories());
    }
}
