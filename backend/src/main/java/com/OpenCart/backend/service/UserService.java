package com.OpenCart.backend.service;

import com.OpenCart.backend.dto.*;
import com.OpenCart.backend.model.*;
import com.OpenCart.backend.repository.*;
import com.OpenCart.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class UserService {

    @Autowired private UserRepository       userRepository;
    @Autowired private CustomerRepository   customerRepository;
    @Autowired private AddressRepository    addressRepository;
    @Autowired private CartRepository       cartRepository;
    @Autowired private CartItemRepository   cartItemRepository;
    @Autowired private WishlistRepository   wishlistRepository;
    @Autowired private WishlistItemRepository wishlistItemRepository;
    @Autowired private ProductRepository    productRepository;
    @Autowired private OrderRepository      orderRepository;
    @Autowired private OrderItemRepository  orderItemRepository;
    @Autowired private ReviewRepository     reviewRepository;
    @Autowired private PasswordEncoder      passwordEncoder;
    @Autowired private JwtUtil              jwtUtil;

    // ═══════════════════════════════════════════════════════════════
    //  AUTH
    // ═══════════════════════════════════════════════════════════════

    /**
     * Register new customer.
     * Auto-creates: Customer profile, Cart, Wishlist.
     * Returns a signed JWT so the client is logged in immediately.
     */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        User saved = userRepository.save(user);

        Customer customer = new Customer();
        customer.setUser(saved);
        customerRepository.save(customer);

        Cart cart = new Cart();
        cart.setUser(saved);
        cartRepository.save(cart);

        Wishlist wishlist = new Wishlist();
        wishlist.setUser(saved);
        wishlistRepository.save(wishlist);

        String token = jwtUtil.generateToken(saved.getUserId(), saved.getEmail(), "ROLE_USER");
        return new AuthResponse(token, saved.getUserId(), saved.getEmail(),
                saved.getFirstName(), saved.getLastName(), "ROLE_USER");
    }

    /**
     * Authenticate user. Returns signed JWT on success.
     */
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getUserId(), user.getEmail(), "ROLE_USER");
        return new AuthResponse(token, user.getUserId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), "ROLE_USER");
    }

    // ═══════════════════════════════════════════════════════════════
    //  PROFILE
    // ═══════════════════════════════════════════════════════════════

    public User getProfile(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateProfile(String userId, RegisterRequest req) {
        User user = getProfile(userId);
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setEmail(req.getEmail());
        return userRepository.save(user);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ADDRESS
    // ═══════════════════════════════════════════════════════════════

    public List<Address> getAddresses(String userId) {
        return addressRepository.findByUserUserId(userId);
    }

    public Address addAddress(String userId, AddressRequest req) {
        User user = getProfile(userId);
        Address address = new Address();
        address.setUser(user);
        address.setCountry(req.getCountry());
        address.setCity(req.getCity());
        address.setAddress(req.getAddress());
        address.setPincode(req.getPincode());
        return addressRepository.save(address);
    }

    public Address updateAddress(Long addressId, AddressRequest req) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));
        address.setCountry(req.getCountry());
        address.setCity(req.getCity());
        address.setAddress(req.getAddress());
        address.setPincode(req.getPincode());
        return addressRepository.save(address);
    }

    public void deleteAddress(Long addressId) {
        if (!addressRepository.existsById(addressId)) {
            throw new RuntimeException("Address not found");
        }
        addressRepository.deleteById(addressId);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CART
    // ═══════════════════════════════════════════════════════════════

    public List<CartItem> getCart(String userId) {
        Cart cart = cartRepository.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
        return cartItemRepository.findByCartCartId(cart.getCartId());
    }

    public CartItem addToCart(String userId, CartItemRequest req) {
        Cart cart = cartRepository.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // If product already in cart, increment qty
        return cartItemRepository
                .findByCartCartIdAndProductProductId(cart.getCartId(), product.getProductId())
                .map(existing -> {
                    existing.setQty(existing.getQty() + req.getQty());
                    return cartItemRepository.save(existing);
                })
                .orElseGet(() -> {
                    CartItem item = new CartItem();
                    item.setCart(cart);
                    item.setProduct(product);
                    item.setQty(req.getQty());
                    return cartItemRepository.save(item);
                });
    }

    public CartItem updateCartItem(Long cartItemId, Integer qty) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        item.setQty(qty);
        return cartItemRepository.save(item);
    }

    public void removeFromCart(Long cartItemId) {
        if (!cartItemRepository.existsById(cartItemId)) {
            throw new RuntimeException("Cart item not found");
        }
        cartItemRepository.deleteById(cartItemId);
    }

    @Transactional
    public void clearCart(String userId) {
        Cart cart = cartRepository.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
        cartItemRepository.deleteByCartCartId(cart.getCartId());
    }

    // ═══════════════════════════════════════════════════════════════
    //  WISHLIST
    // ═══════════════════════════════════════════════════════════════

    public List<WishlistItem> getWishlist(String userId) {
        Wishlist wishlist = wishlistRepository.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wishlist not found"));
        return wishlistItemRepository.findByWishlistWishlistId(wishlist.getWishlistId());
    }

    public WishlistItem addToWishlist(String userId, Long productId) {
        Wishlist wishlist = wishlistRepository.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wishlist not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        wishlistItemRepository
                .findByWishlistWishlistIdAndProductProductId(wishlist.getWishlistId(), productId)
                .ifPresent(w -> { throw new RuntimeException("Product already in wishlist"); });

        WishlistItem item = new WishlistItem();
        item.setWishlist(wishlist);
        item.setProduct(product);
        return wishlistItemRepository.save(item);
    }

    public void removeFromWishlist(Long wishlistItemId) {
        if (!wishlistItemRepository.existsById(wishlistItemId)) {
            throw new RuntimeException("Wishlist item not found");
        }
        wishlistItemRepository.deleteById(wishlistItemId);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ORDERS
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public Order placeOrder(String userId, OrderRequest req) {
        User user = getProfile(userId);
        Address address = addressRepository.findById(req.getAddressId())
                .orElseThrow(() -> new RuntimeException("Address not found"));

        List<CartItem> cartItems = getCart(userId);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        Order order = new Order();
        order.setUser(user);
        order.setAddress(address);
        Order savedOrder = orderRepository.save(order);

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();

            if (product.getStock() < cartItem.getQty()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getProductName());
            }

            // Snapshot price + offer at placement time so the order is
            // immune to later changes on the Product.
            Integer percentBoxed = product.getOfferPercent();
            LocalDate validUntil = product.getOfferValidUntil();
            double basePrice = product.getPrice() != null ? product.getPrice() : 0.0;

            double unitPrice = basePrice;
            Integer frozenPercent = null;
            if (percentBoxed != null && percentBoxed > 0
                    && (validUntil == null || !validUntil.isBefore(LocalDate.now()))) {
                int percent = percentBoxed;
                unitPrice = Math.round(basePrice * (1.0 - percent / 100.0));
                frozenPercent = percent;
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(product);
            orderItem.setQty(cartItem.getQty());
            orderItem.setStatus("PENDING");
            orderItem.setUnitPrice(unitPrice);
            orderItem.setOfferPercent(frozenPercent);
            orderItemRepository.save(orderItem);

            product.setStock(product.getStock() - cartItem.getQty());
            productRepository.save(product);
        }

        clearCart(userId);
        return savedOrder;
    }

    public List<Order> getMyOrders(String userId) {
        return orderRepository.findByUserUserId(userId);
    }

    public List<OrderItem> getOrderItems(Long orderId) {
        orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return orderItemRepository.findByOrderOrderId(orderId);
    }

    // ═══════════════════════════════════════════════════════════════
    //  REVIEWS
    // ═══════════════════════════════════════════════════════════════

    public Review addReview(String userId, ReviewRequest req) {
        User user = getProfile(userId);
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (req.getRating() < 1 || req.getRating() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setRating(req.getRating());
        review.setComment(req.getComment());
        return reviewRepository.save(review);
    }

    public List<Review> getMyReviews(String userId) {
        return reviewRepository.findByUserUserId(userId);
    }

    public void deleteReview(Long reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new RuntimeException("Review not found");
        }
        reviewRepository.deleteById(reviewId);
    }
}
