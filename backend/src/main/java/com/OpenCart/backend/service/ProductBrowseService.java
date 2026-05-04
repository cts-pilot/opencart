package com.OpenCart.backend.service;

import com.OpenCart.backend.model.Category;
import com.OpenCart.backend.model.Product;
import com.OpenCart.backend.model.Review;
import com.OpenCart.backend.repository.CategoryRepository;
import com.OpenCart.backend.repository.ProductRepository;
import com.OpenCart.backend.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductBrowseService {

    @Autowired private ProductRepository  productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ReviewRepository   reviewRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public List<Product> getProductsByCategory(Long categoryId) {
        categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        return productRepository.findByCategoryCategoryId(categoryId);
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public List<Review> getReviewsForProduct(Long productId) {
        productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return reviewRepository.findByProductProductId(productId);
    }
}
