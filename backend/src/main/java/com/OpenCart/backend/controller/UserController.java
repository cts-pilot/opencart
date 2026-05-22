package com.OpenCart.backend.controller;

import com.OpenCart.backend.dto.*;
import com.OpenCart.backend.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.OpenCart.backend.service.UserService;
import com.OpenCart.backend.service.PasswordResetService;
import java.util.List;
import java.util.Map;

/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BASE PATH : /api/user                                      │
 * │  PUBLIC    : /register  /login                              │
 * │  PROTECTED : everything else → requires Bearer ROLE_USER    │
 * └─────────────────────────────────────────────────────────────┘
 *
 * userId is NEVER taken from the URL — always from the verified JWT
 * via @AuthenticationPrincipal.
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordResetService passwordResetService;

    // ═══════════════════════════════════════════════════════════════
    //  AUTH  (public)
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/user/register
     * Body : { firstName, lastName, email, password }
     * Returns : AuthResponse { token, userId, email, firstName, lastName, role }
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest req) {
        return ResponseEntity.ok(userService.register(req));
    }

    /**
     * POST /api/user/login
     * Body : { email, password }
     * Returns : AuthResponse { token, userId, email, firstName, lastName, role }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(userService.login(req));
    }

    /**
     * POST /api/user/forgot-password
     * Body : { email }
     * Always returns 200 — even for unknown emails — to avoid leaking which
     * accounts exist. When the email is known, a reset link is sent.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        passwordResetService.requestPasswordReset(req);
        return ResponseEntity.ok(Map.of(
                "message",
                "If an account exists for that email, a reset link has been sent."
        ));
    }

    /**
     * POST /api/user/reset-password
     * Body : { token, newPassword }
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody ResetPasswordRequest req) {
        passwordResetService.resetPassword(req);
        return ResponseEntity.ok(Map.of("message", "Password has been reset. You can now sign in."));
    }

    // ═══════════════════════════════════════════════════════════════
    //  PROFILE
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/user/profile
     * Header : Authorization: Bearer <token>
     */
    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    /**
     * PUT /api/user/profile
     * Body : { firstName, lastName, email }
     */
    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(
            @AuthenticationPrincipal String userId,
            @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(userService.updateProfile(userId, req));
    }

    // ═══════════════════════════════════════════════════════════════
    //  ADDRESS
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/user/addresses
     */
    @GetMapping("/addresses")
    public ResponseEntity<List<Address>> getAddresses(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userService.getAddresses(userId));
    }

    /**
     * POST /api/user/addresses
     * Body : { country, city, address, pincode }
     */
    @PostMapping("/addresses")
    public ResponseEntity<Address> addAddress(
            @AuthenticationPrincipal String userId,
            @RequestBody AddressRequest req) {
        return ResponseEntity.ok(userService.addAddress(userId, req));
    }

    /**
     * PUT /api/user/addresses/{addressId}
     * Body : { country, city, address, pincode }
     */
    @PutMapping("/addresses/{addressId}")
    public ResponseEntity<Address> updateAddress(
            @PathVariable Long addressId,
            @RequestBody AddressRequest req) {
        return ResponseEntity.ok(userService.updateAddress(addressId, req));
    }

    /**
     * DELETE /api/user/addresses/{addressId}
     */
    @DeleteMapping("/addresses/{addressId}")
    public ResponseEntity<String> deleteAddress(@PathVariable Long addressId) {
        userService.deleteAddress(addressId);
        return ResponseEntity.ok("Address deleted successfully");
    }

    // ═══════════════════════════════════════════════════════════════
    //  CART
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/user/cart
     */
    @GetMapping("/cart")
    public ResponseEntity<List<CartItem>> getCart(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userService.getCart(userId));
    }

    /**
     * POST /api/user/cart
     * Body : { productId, qty }
     * If product already in cart, qty is incremented.
     */
    @PostMapping("/cart")
    public ResponseEntity<CartItem> addToCart(
            @AuthenticationPrincipal String userId,
            @RequestBody CartItemRequest req) {
        return ResponseEntity.ok(userService.addToCart(userId, req));
    }

    /**
     * PUT /api/user/cart/items/{cartItemId}?qty=3
     */
    @PutMapping("/cart/items/{cartItemId}")
    public ResponseEntity<CartItem> updateCartItem(
            @PathVariable Long cartItemId,
            @RequestParam Integer qty) {
        return ResponseEntity.ok(userService.updateCartItem(cartItemId, qty));
    }

    /**
     * DELETE /api/user/cart/items/{cartItemId}
     */
    @DeleteMapping("/cart/items/{cartItemId}")
    public ResponseEntity<String> removeFromCart(@PathVariable Long cartItemId) {
        userService.removeFromCart(cartItemId);
        return ResponseEntity.ok("Item removed from cart");
    }

    /**
     * DELETE /api/user/cart
     * Removes all items from cart.
     */
    @DeleteMapping("/cart")
    public ResponseEntity<String> clearCart(@AuthenticationPrincipal String userId) {
        userService.clearCart(userId);
        return ResponseEntity.ok("Cart cleared");
    }

    // ═══════════════════════════════════════════════════════════════
    //  WISHLIST
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/user/wishlist
     */
    @GetMapping("/wishlist")
    public ResponseEntity<List<WishlistItem>> getWishlist(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userService.getWishlist(userId));
    }

    /**
     * POST /api/user/wishlist/{productId}
     */
    @PostMapping("/wishlist/{productId}")
    public ResponseEntity<WishlistItem> addToWishlist(
            @AuthenticationPrincipal String userId,
            @PathVariable Long productId) {
        return ResponseEntity.ok(userService.addToWishlist(userId, productId));
    }

    /**
     * DELETE /api/user/wishlist/items/{wishlistItemId}
     */
    @DeleteMapping("/wishlist/items/{wishlistItemId}")
    public ResponseEntity<String> removeFromWishlist(@PathVariable Long wishlistItemId) {
        userService.removeFromWishlist(wishlistItemId);
        return ResponseEntity.ok("Removed from wishlist");
    }

    // ═══════════════════════════════════════════════════════════════
    //  ORDERS
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/user/orders
     * Body : { addressId }
     * Places order from current cart → reduces stock → clears cart.
     */
    @PostMapping("/orders")
    public ResponseEntity<Order> placeOrder(
            @AuthenticationPrincipal String userId,
            @RequestBody OrderRequest req) {
        return ResponseEntity.ok(userService.placeOrder(userId, req));
    }

    /**
     * GET /api/user/orders
     */
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getMyOrders(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userService.getMyOrders(userId));
    }

    /**
     * GET /api/user/orders/{orderId}/items
     */
    @GetMapping("/orders/{orderId}/items")
    public ResponseEntity<List<OrderItem>> getOrderItems(@PathVariable Long orderId) {
        return ResponseEntity.ok(userService.getOrderItems(orderId));
    }

    // ═══════════════════════════════════════════════════════════════
    //  REVIEWS
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/user/reviews
     * Body : { productId, rating (1-5), comment }
     */
    @PostMapping("/reviews")
    public ResponseEntity<Review> addReview(
            @AuthenticationPrincipal String userId,
            @RequestBody ReviewRequest req) {
        return ResponseEntity.ok(userService.addReview(userId, req));
    }

    /**
     * GET /api/user/reviews
     */
    @GetMapping("/reviews")
    public ResponseEntity<List<Review>> getMyReviews(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userService.getMyReviews(userId));
    }

    /**
     * DELETE /api/user/reviews/{reviewId}
     */
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<String> deleteReview(@PathVariable Long reviewId) {
        userService.deleteReview(reviewId);
        return ResponseEntity.ok("Review deleted");
    }
}
