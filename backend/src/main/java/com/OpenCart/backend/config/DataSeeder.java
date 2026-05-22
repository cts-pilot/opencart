package com.OpenCart.backend.config;

import com.OpenCart.backend.model.*;
import com.OpenCart.backend.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * One-shot data seeder.
 *
 * Enable via   `app.seed.run=true` in application.properties and restart.
 * After it runs, set it back to false so the DB is not wiped on every restart.
 *
 * What it does (in order):
 *   1. Truncates every application table (FK checks disabled temporarily).
 *   2. Creates the 8 product categories.
 *   3. Creates a demo seller user  (seller@gmail.com / Seller@123).
 *   4. Inserts 5 products into each category (40 products total).
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Value("${app.seed.run:false}")
    private boolean shouldRun;

    @PersistenceContext
    private EntityManager em;

    @Autowired private UserRepository       userRepository;
    @Autowired private SellerRepository     sellerRepository;
    @Autowired private CategoryRepository   categoryRepository;
    @Autowired private ProductRepository    productRepository;
    @Autowired private PasswordEncoder      passwordEncoder;

    private static final String[] CATEGORIES = {
            "Mobile", "Laptop", "Tablet", "Smartwatch",
            "Headphones", "Camera", "Gaming Console", "Bluetooth Speaker"
    };

    private static final List<String> TABLES_IN_DEPENDENCY_ORDER = List.of(
            "password_reset_tokens",
            "cart_items",
            "wishlist_items",
            "order_items",
            "reviews",
            "cart",
            "wishlist",
            "orders",
            "address",
            "product",
            "customer",
            "seller",
            "users",
            "categories"
    );

    @Override
    @Transactional
    public void run(String... args) {
        if (!shouldRun) {
            return;
        }

        log.warn("================================================================");
        log.warn(" DataSeeder is enabled — WIPING all application data and reseeding.");
        log.warn(" Set app.seed.run=false in application.properties to disable.");
        log.warn("================================================================");

        truncateAll();
        Map<String, Category> categories = seedCategories();
        Seller seller = seedSeller();
        seedProducts(seller, categories);

        log.warn(" Seeding complete. Login as seller@gmail.com / Seller@123");
    }

    private void truncateAll() {
        em.createNativeQuery("SET FOREIGN_KEY_CHECKS = 0").executeUpdate();
        for (String table : TABLES_IN_DEPENDENCY_ORDER) {
            try {
                em.createNativeQuery("TRUNCATE TABLE " + table).executeUpdate();
                log.info(" truncated {}", table);
            } catch (Exception ex) {
                log.warn(" could not truncate {} ({}). Skipping.", table, ex.getMessage());
            }
        }
        em.createNativeQuery("SET FOREIGN_KEY_CHECKS = 1").executeUpdate();
    }

    private Map<String, Category> seedCategories() {
        Map<String, Category> map = new LinkedHashMap<>();
        for (String name : CATEGORIES) {
            Category c = new Category();
            c.setCategoryName(name);
            map.put(name, categoryRepository.save(c));
        }
        log.info(" seeded {} categories", map.size());
        return map;
    }

    private Seller seedSeller() {
        User user = new User();
        user.setFirstName("Demo");
        user.setLastName("Seller");
        user.setEmail("seller@gmail.com");
        user.setPassword(passwordEncoder.encode("Seller@123"));
        user = userRepository.save(user);

        Seller seller = new Seller();
        seller.setUser(user);
        seller.setShopName("OpenCart Flagship Store");
        seller = sellerRepository.save(seller);

        log.info(" seeded seller user {} (id={})", user.getEmail(), user.getUserId());
        return seller;
    }

    private void seedProducts(Seller seller, Map<String, Category> cats) {
        // {name, price, stock, image-keyword}
        seedGroup(seller, cats.get("Mobile"), new Object[][]{
                {"Samsung Galaxy S24 Ultra",   124999, 25, "smartphone"},
                {"Apple iPhone 15 Pro",        134900, 18, "iphone"},
                {"OnePlus 12",                  64999, 32, "oneplus"},
                {"Xiaomi Redmi Note 13 Pro",    18999, 60, "redmi"},
                {"Google Pixel 8",              75999, 14, "pixel-phone"}
        });

        seedGroup(seller, cats.get("Laptop"), new Object[][]{
                {"Apple MacBook Air M3",       114900, 12, "macbook-air"},
                {"Dell XPS 15",                159900,  8, "dell-laptop"},
                {"HP Pavilion 14",              64999, 22, "hp-laptop"},
                {"Lenovo ThinkPad X1 Carbon",  145000,  6, "thinkpad"},
                {"Asus ROG Strix G16",         169999,  9, "gaming-laptop"}
        });

        seedGroup(seller, cats.get("Tablet"), new Object[][]{
                {"Apple iPad Pro 12.9\"",      119900, 11, "ipad-pro"},
                {"Samsung Galaxy Tab S9",       89999, 17, "galaxy-tab"},
                {"Apple iPad Air",              59900, 24, "ipad-air"},
                {"Lenovo Tab P12",              32999, 30, "lenovo-tab"},
                {"Xiaomi Pad 6",                27999, 25, "xiaomi-pad"}
        });

        seedGroup(seller, cats.get("Smartwatch"), new Object[][]{
                {"Apple Watch Series 9",        41900, 20, "apple-watch"},
                {"Samsung Galaxy Watch 6",      29999, 28, "galaxy-watch"},
                {"Fitbit Versa 4",              19999, 35, "fitbit"},
                {"Garmin Forerunner 265",       49990,  7, "garmin"},
                {"Noise ColorFit Pro 5",         3499,100, "noise-watch"}
        });

        seedGroup(seller, cats.get("Headphones"), new Object[][]{
                {"Sony WH-1000XM5",             29990, 14, "sony-headphones"},
                {"Bose QuietComfort 45",        32900,  9, "bose"},
                {"Apple AirPods Pro 2",         24900, 22, "airpods"},
                {"JBL Tune 760NC",               7999, 45, "jbl-headphones"},
                {"boAt Rockerz 450",             1499, 90, "boat-rockerz"}
        });

        seedGroup(seller, cats.get("Camera"), new Object[][]{
                {"Canon EOS R8",               159999,  4, "canon-r8"},
                {"Sony Alpha A7 IV",           234000,  3, "sony-alpha"},
                {"Nikon Z50",                   87990,  6, "nikon-z50"},
                {"Fujifilm X-T30 II",           95999,  5, "fujifilm"},
                {"GoPro HERO12 Black",          41500, 18, "gopro"}
        });

        seedGroup(seller, cats.get("Gaming Console"), new Object[][]{
                {"Sony PlayStation 5",          54990, 10, "playstation-5"},
                {"Xbox Series X",               49990,  8, "xbox-series-x"},
                {"Nintendo Switch OLED",        35999, 16, "nintendo-switch"},
                {"Steam Deck OLED 512GB",       65999,  5, "steam-deck"},
                {"PlayStation 5 Slim",          49990, 12, "ps5-slim"}
        });

        seedGroup(seller, cats.get("Bluetooth Speaker"), new Object[][]{
                {"JBL Charge 5",                14999, 30, "jbl-charge"},
                {"Sony SRS-XB13",                4499, 50, "sony-speaker"},
                {"Bose SoundLink Flex",         23900,  9, "bose-soundlink"},
                {"Marshall Emberton II",        14999, 12, "marshall-speaker"},
                {"boAt Stone 1000",              2999, 70, "boat-stone"}
        });

        log.info(" seeded {} products", productRepository.count());
    }

    private void seedGroup(Seller seller, Category category, Object[][] rows) {
        if (category == null) {
            log.warn("Category missing — skipping group.");
            return;
        }
        for (Object[] row : rows) {
            Product p = new Product();
            p.setProductName((String) row[0]);
            p.setPrice(((Number) row[1]).doubleValue());
            p.setStock((Integer) row[2]);
            p.setProductUrl(imageUrl((String) row[0], (String) row[3]));
            p.setCategory(category);
            p.setSeller(seller);
            productRepository.save(p);
        }
    }

    private String imageUrl(String productName, String keyword) {
        // Use placehold.co — reliable, no API key, slate+amber branded fallback.
        String text = productName.replace(" ", "+").replace("\"", "");
        return "https://placehold.co/600x600/0f172a/fbbf24?text=" + text;
    }
}