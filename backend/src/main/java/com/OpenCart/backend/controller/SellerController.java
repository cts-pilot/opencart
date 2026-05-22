package com.OpenCart.backend.controller;

import com.OpenCart.backend.dto.*;
import com.OpenCart.backend.model.*;
import com.OpenCart.backend.service.SellerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ┌────────────────────────────────────────────────────────────────┐
 * │  BASE PATH : /api/seller                                       │
 * │  PUBLIC    : /register  /login                                 │
 * │  PROTECTED : everything else → requires Bearer ROLE_SELLER     │
 * └────────────────────────────────────────────────────────────────┘
 *
 * userId is NEVER taken from the URL — always from the verified JWT
 * via @AuthenticationPrincipal.
 */
@RestController
@RequestMapping("/api/seller")
public class SellerController {

    @Autowired
    private SellerService sellerService;

    // ═══════════════════════════════════════════════════════════════
    //  AUTH  (public)
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/seller/register
     * Body : { firstName, lastName, email, password, shopName }
     * Returns : AuthResponse { token, userId, email, firstName, lastName, role }
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody SellerRegisterRequest req) {
        return ResponseEntity.ok(sellerService.registerSeller(req));
    }

    /**
     * POST /api/seller/login
     * Body : { email, password }
     * Returns : AuthResponse { token, userId, email, firstName, lastName, role }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(sellerService.login(req));
    }

    // ═══════════════════════════════════════════════════════════════
    //  PROFILE
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/seller/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<Seller> getProfile(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(sellerService.getSellerByUserId(userId));
    }

    /**
     * PUT /api/seller/profile
     * Body : { shopName }
     */
    @PutMapping("/profile")
    public ResponseEntity<Seller> updateShopName(
            @AuthenticationPrincipal String userId,
            @RequestBody ShopNameRequest req) {
        return ResponseEntity.ok(sellerService.updateShopName(userId, req.getShopName()));
    }

    // ═══════════════════════════════════════════════════════════════
    //  PRODUCTS
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/seller/products
     */
    @GetMapping("/products")
    public ResponseEntity<List<Product>> getMyProducts(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(sellerService.getMyProducts(userId));
    }

    /**
     * POST /api/seller/products
     * Body : { productName, productUrl, price, stock, categoryId }
     */
    @PostMapping("/products")
    public ResponseEntity<Product> addProduct(
            @AuthenticationPrincipal String userId,
            @RequestBody ProductRequest req) {
        return ResponseEntity.ok(sellerService.addProduct(userId, req));
    }

    /**
     * PUT /api/seller/products/{productId}
     * Body : { productName, productUrl, price, stock, categoryId }
     * Only the owning seller can update.
     */
    @PutMapping("/products/{productId}")
    public ResponseEntity<Product> updateProduct(
            @AuthenticationPrincipal String userId,
            @PathVariable Long productId,
            @RequestBody ProductRequest req) {
        return ResponseEntity.ok(sellerService.updateProduct(userId, productId, req));
    }

    /**
     * DELETE /api/seller/products/{productId}
     * Only the owning seller can delete.
     */
    @DeleteMapping("/products/{productId}")
    public ResponseEntity<String> deleteProduct(
            @AuthenticationPrincipal String userId,
            @PathVariable Long productId) {
        sellerService.deleteProduct(userId, productId);
        return ResponseEntity.ok("Product deleted successfully");
    }

    /**
     * PATCH /api/seller/products/{productId}/stock
     * Body : { stock }
     */
    @PatchMapping("/products/{productId}/stock")
    public ResponseEntity<Product> updateStock(
            @AuthenticationPrincipal String userId,
            @PathVariable Long productId,
            @RequestBody StockUpdateRequest req) {
        return ResponseEntity.ok(sellerService.updateStock(userId, productId, req.getStock()));
    }

    /**
     * PATCH /api/seller/products/{productId}/offer
     * Body : { offerPercent, offerValidUntil }
     * Pass null offerPercent to remove the offer.
     */
    @PatchMapping("/products/{productId}/offer")
    public ResponseEntity<Product> updateOffer(
            @AuthenticationPrincipal String userId,
            @PathVariable Long productId,
            @RequestBody OfferRequest req) {
        return ResponseEntity.ok(sellerService.updateOffer(userId, productId, req));
    }

    // ═══════════════════════════════════════════════════════════════
    //  ORDERS
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/seller/orders
     * Returns all order items for products belonging to this seller.
     */
    @GetMapping("/orders")
    public ResponseEntity<List<OrderItem>> getMyOrders(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(sellerService.getMyOrders(userId));
    }

    /**
     * PATCH /api/seller/orders/{orderItemId}/status
     * Body : { status }   → PENDING | SHIPPED | DELIVERED | CANCELLED
     * Only the seller who owns the product can update its order status.
     */
    @PatchMapping("/orders/{orderItemId}/status")
    public ResponseEntity<OrderItem> updateOrderStatus(
            @AuthenticationPrincipal String userId,
            @PathVariable Long orderItemId,
            @RequestBody OrderStatusRequest req) {
        return ResponseEntity.ok(sellerService.updateOrderStatus(userId, orderItemId, req));
    }

    // ═══════════════════════════════════════════════════════════════
    //  REVIEWS
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/seller/products/{productId}/reviews
     * Returns all customer reviews for a product owned by this seller.
     */
    @GetMapping("/products/{productId}/reviews")
    public ResponseEntity<List<Review>> getProductReviews(
            @AuthenticationPrincipal String userId,
            @PathVariable Long productId) {
        return ResponseEntity.ok(sellerService.getProductReviews(userId, productId));
    }
}
