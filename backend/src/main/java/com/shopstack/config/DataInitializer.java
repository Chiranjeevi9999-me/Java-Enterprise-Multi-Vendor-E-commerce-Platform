package com.shopstack.config;

import com.shopstack.model.*;
import com.shopstack.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, VendorProfileRepository vendorProfileRepository, CategoryRepository categoryRepository, ProductRepository productRepository, ReviewRepository reviewRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.vendorProfileRepository = vendorProfileRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.reviewRepository = reviewRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            return;
        }

        // 1. Create Default Users
        User admin = User.builder()
                .email("admin@shopstack.com")
                .password(passwordEncoder.encode("admin123"))
                .fullName("System Administrator")
                .phoneNumber("+1 555-0100")
                .role(Role.ADMIN)
                .enabled(true)
                .build();

        User vendorUser1 = User.builder()
                .email("techstore@shopstack.com")
                .password(passwordEncoder.encode("vendor123"))
                .fullName("Nexus Tech Innovations")
                .phoneNumber("+1 555-0101")
                .role(Role.VENDOR)
                .enabled(true)
                .build();

        User vendorUser2 = User.builder()
                .email("apparel@shopstack.com")
                .password(passwordEncoder.encode("vendor123"))
                .fullName("Urban Thread Co.")
                .phoneNumber("+1 555-0102")
                .role(Role.VENDOR)
                .enabled(true)
                .build();

        User customer1 = User.builder()
                .email("customer@shopstack.com")
                .password(passwordEncoder.encode("customer123"))
                .fullName("Sarah Jenkins")
                .phoneNumber("+1 555-0103")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build();

        userRepository.saveAll(List.of(admin, vendorUser1, vendorUser2, customer1));

        // 2. Create Vendor Profiles
        VendorProfile vendor1 = VendorProfile.builder()
                .user(vendorUser1)
                .storeName("Nexus Electronics")
                .description("Premier vendor for flagship smartphones, audio gear, and modern accessories.")
                .logoUrl("https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80")
                .status(VendorStatus.APPROVED)
                .commissionRate(8.5)
                .rating(4.9)
                .build();

        VendorProfile vendor2 = VendorProfile.builder()
                .user(vendorUser2)
                .storeName("Aura Fashion House")
                .description("Luxury sustainable fashion, footwear, and designer everyday wear.")
                .logoUrl("https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&auto=format&fit=crop&q=80")
                .status(VendorStatus.APPROVED)
                .commissionRate(12.0)
                .rating(4.7)
                .build();

        vendorProfileRepository.saveAll(List.of(vendor1, vendor2));

        // 3. Create Categories
        Category catElectronics = Category.builder()
                .name("Electronics & Gadgets")
                .slug("electronics")
                .description("Smartphones, audio, laptops and smart accessories")
                .icon("Cpu")
                .build();

        Category catFashion = Category.builder()
                .name("Fashion & Lifestyle")
                .slug("fashion")
                .description("Trendy clothing, shoes, watches, and streetwear")
                .icon("Shirt")
                .build();

        Category catHome = Category.builder()
                .name("Home & Living")
                .slug("home-living")
                .description("Modern home decor, kitchenware, and smart appliances")
                .icon("Home")
                .build();

        Category catFitness = Category.builder()
                .name("Fitness & Outdoors")
                .slug("fitness")
                .description("Gym equipment, sportswear, and outdoor gear")
                .icon("Activity")
                .build();

        categoryRepository.saveAll(List.of(catElectronics, catFashion, catHome, catFitness));

        // 4. Create Products
        Product p1 = Product.builder()
                .title("Aura Wireless Noise-Canceling Headphones")
                .description("High-fidelity audio with spatial sound, 40-hour battery life, and ultra-soft memory foam ear cushions.")
                .brand("Nexus Sound")
                .sku("NEX-AUD-001")
                .price(299.99)
                .discountPrice(249.99)
                .stockQuantity(45)
                .imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80")
                .category(catElectronics)
                .vendorProfile(vendor1)
                .status(ProductStatus.ACTIVE)
                .featured(true)
                .rating(4.9)
                .reviewCount(28)
                .build();

        Product p2 = Product.builder()
                .title("ProBook Ultra 15 Slate Gray Edition")
                .description("Powered by 14th Gen Intel i9, 32GB RAM, 1TB NVMe SSD with 120Hz OLED Display for professionals.")
                .brand("Nexus Tech")
                .sku("NEX-LAP-009")
                .price(1499.00)
                .discountPrice(1399.00)
                .stockQuantity(12)
                .imageUrl("https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80")
                .category(catElectronics)
                .vendorProfile(vendor1)
                .status(ProductStatus.ACTIVE)
                .featured(true)
                .rating(4.8)
                .reviewCount(14)
                .build();

        Product p3 = Product.builder()
                .title("Organic Cotton Minimalist Hoodie")
                .description("Crafted from 100% heavy organic French terry cotton. Pre-shrunk relaxed fit.")
                .brand("Aura Wear")
                .sku("AUR-CLO-102")
                .price(89.00)
                .discountPrice(69.99)
                .stockQuantity(80)
                .imageUrl("https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80")
                .category(catFashion)
                .vendorProfile(vendor2)
                .status(ProductStatus.ACTIVE)
                .featured(true)
                .rating(4.7)
                .reviewCount(35)
                .build();

        Product p4 = Product.builder()
                .title("Chrono Steel Executive Watch")
                .description("Water-resistant up to 100m, sapphire crystal glass with Japanese quartz movement.")
                .brand("Aura Time")
                .sku("AUR-WTC-501")
                .price(350.00)
                .discountPrice(295.00)
                .stockQuantity(25)
                .imageUrl("https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80")
                .category(catFashion)
                .vendorProfile(vendor2)
                .status(ProductStatus.ACTIVE)
                .featured(false)
                .rating(4.9)
                .reviewCount(9)
                .build();

        Product p5 = Product.builder()
                .title("Ergonomic Smart Desk Lamp with Wireless Charging")
                .description("Adjustable color temperature, auto-dimming sensor, and 15W Qi fast charging base.")
                .brand("Nexus Home")
                .sku("NEX-HOM-088")
                .price(79.99)
                .discountPrice(59.99)
                .stockQuantity(60)
                .imageUrl("https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80")
                .category(catHome)
                .vendorProfile(vendor1)
                .status(ProductStatus.ACTIVE)
                .featured(true)
                .rating(4.6)
                .reviewCount(18)
                .build();

        productRepository.saveAll(List.of(p1, p2, p3, p4, p5));

        // 5. Create Reviews
        Review r1 = Review.builder()
                .product(p1)
                .user(customer1)
                .rating(5)
                .comment("Incredible noise cancellation and battery life! Tested on a long-haul flight and it performed flawlessly.")
                .build();

        Review r2 = Review.builder()
                .product(p3)
                .user(customer1)
                .rating(5)
                .comment("Super soft fabric and fits perfectly. Highly recommend Aura Fashion House!")
                .build();

        reviewRepository.saveAll(List.of(r1, r2));

        System.out.println(">>> [ShopStack DataInitializer] Successfully initialized demo marketplace dataset.");
    }
}
