package com.OpenCart.backend.repository;

import com.OpenCart.backend.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByWishlistWishlistId(Long wishlistId);
    Optional<WishlistItem> findByWishlistWishlistIdAndProductProductId(Long wishlistId, Long productId);
    void deleteByWishlistWishlistId(Long wishlistId);
}
