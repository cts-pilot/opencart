package com.OpenCart.backend.service;

import com.OpenCart.backend.dto.*;
import com.OpenCart.backend.model.*;
import com.OpenCart.backend.repository.*;
import com.OpenCart.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SellerService {

    @Autowired private UserRepository      userRepository;
    @Autowired private SellerRepository    sellerRepository;
    @Autowired private ProductRepository   productRepository;
    @Autowired private CategoryRepository  categoryRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private ReviewRepository    reviewRepository;
    @Autowired private PasswordEncoder     passwordEncoder;
    @Autowired private JwtUtil             jwtUtil;

    // ═══════════════════════════════════════════════════════════════
    //  AUTH
    // ═══════════════════════════════════════════════════════════════

    /**
     * Register new seller account.
     * Creates a User + Seller profile in one transaction.
     * Returns a signed ROLE_SELLER JWT immediately.
     */
    public AuthResponse registerSeller(SellerRegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        User saved = userRepository.save(user);

        Seller seller = new Seller();
        seller.setUser(saved);
        seller.setShopName(req.getShopName());
        sellerRepository.save(seller);

        String token = jwtUtil.generateToken(saved.getUserId(), saved.getEmail(), "ROLE_SELLER");
        return new AuthResponse(token, saved.getUserId(), saved.getEmail(),
                saved.getFirstName(), saved.getLastName(), "ROLE_SELLER");
    }

    /**
     * Authenticate seller. Verifies seller profile exists before issuing ROLE_SELLER token.
     */
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        sellerRepository.findByUserUserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("No seller profile found for this account"));

        String token = jwtUtil.generateToken(user.getUserId(), user.getEmail(), "ROLE_SELLER");
        return new AuthResponse(token, user.getUserId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), "ROLE_SELLER");
    }

    // ═══════════════════════════════════════════════════════════════
    //  PROFILE
    // ═══════════════════════════════════════════════════════════════

    public Seller getSellerByUserId(String userId) {
        return sellerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
    }

    public Seller updateShopName(String userId, String newShopName) {
        Seller seller = getSellerByUserId(userId);
        seller.setShopName(newShopName);
        return sellerRepository.save(seller);
    }

    // ═══════════════════════════════════════════════════════════════
    //  PRODUCTS
    // ═══════════════════════════════════════════════════════════════

    public List<Product> getMyProducts(String userId) {
        Seller seller = getSellerByUserId(userId);
        return productRepository.findBySellerSellerId(seller.getSellerId());
    }

    public Product addProduct(String userId, ProductRequest req) {
        Seller seller = getSellerByUserId(userId);
        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Product product = new Product();
        product.setProductName(req.getProductName());
        product.setProductUrl(req.getProductUrl());
        product.setPrice(req.getPrice());
        product.setStock(req.getStock());
        product.setSeller(seller);
        product.setCategory(category);
        return productRepository.save(product);
    }

    public Product updateProduct(String userId, Long productId, ProductRequest req) {
        Seller seller   = getSellerByUserId(userId);
        Product product = getOwnedProduct(seller, productId);
        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        product.setProductName(req.getProductName());
        product.setProductUrl(req.getProductUrl());
        product.setPrice(req.getPrice());
        product.setStock(req.getStock());
        product.setCategory(category);
        return productRepository.save(product);
    }

    public void deleteProduct(String userId, Long productId) {
        Seller seller = getSellerByUserId(userId);
        getOwnedProduct(seller, productId); // ownership check
        productRepository.deleteById(productId);
    }

    public Product updateStock(String userId, Long productId, Integer stock) {
        Seller seller   = getSellerByUserId(userId);
        Product product = getOwnedProduct(seller, productId);
        product.setStock(stock);
        return productRepository.save(product);
    }

    public Product updateOffer(String userId, Long productId, com.OpenCart.backend.dto.OfferRequest req) {
        Seller seller = getSellerByUserId(userId);
        Product product = getOwnedProduct(seller, productId);

        Integer percent = req.getOfferPercent();
        if (percent != null && (percent <= 0 || percent > 90)) {
            throw new RuntimeException("Offer percent must be between 1 and 90");
        }

        product.setOfferPercent(percent);
        product.setOfferValidUntil(req.getOfferValidUntil());
        return productRepository.save(product);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ORDERS
    // ═══════════════════════════════════════════════════════════════

    public List<OrderItem> getMyOrders(String userId) {
        Seller seller = getSellerByUserId(userId);
        return orderItemRepository.findByProductSellerSellerId(seller.getSellerId());
    }

    public OrderItem updateOrderStatus(String userId, Long orderItemId, OrderStatusRequest req) {
        Seller seller     = getSellerByUserId(userId);
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Order item not found"));

        if (!orderItem.getProduct().getSeller().getSellerId().equals(seller.getSellerId())) {
            throw new RuntimeException("Unauthorized: order item does not belong to this seller");
        }

        orderItem.setStatus(req.getStatus());
        return orderItemRepository.save(orderItem);
    }

    // ═══════════════════════════════════════════════════════════════
    //  REVIEWS
    // ═══════════════════════════════════════════════════════════════

    public List<Review> getProductReviews(String userId, Long productId) {
        Seller seller = getSellerByUserId(userId);
        getOwnedProduct(seller, productId); // ownership check
        return reviewRepository.findByProductProductId(productId);
    }

    // ═══════════════════════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Fetches a product and verifies it belongs to the given seller.
     * Throws appropriate exceptions if not found or unauthorized.
     */
    private Product getOwnedProduct(Seller seller, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (!product.getSeller().getSellerId().equals(seller.getSellerId())) {
            throw new RuntimeException("Unauthorized: product does not belong to this seller");
        }
        return product;
    }
}
