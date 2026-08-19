package com.shopstack.config;

import com.shopstack.model.*;
import com.shopstack.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           VendorProfileRepository vendorProfileRepository,
                           CategoryRepository categoryRepository,
                           ProductRepository productRepository,
                           ReviewRepository reviewRepository,
                           OrderRepository orderRepository,
                           PaymentRepository paymentRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.vendorProfileRepository = vendorProfileRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
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
                .fullName("Chiru")
                .phoneNumber("+1 555-0103")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build();

        User customer2 = User.builder()
                .email("alex.miller@gmail.com")
                .password(passwordEncoder.encode("customer123"))
                .fullName("Alex Miller")
                .phoneNumber("+1 555-0104")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build();

        userRepository.saveAll(List.of(admin, vendorUser1, vendorUser2, customer1, customer2));

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

        // 6. Create Seed Orders & Payments across past days
        LocalDateTime now = LocalDateTime.now();

        // Order 1: Delivered electronics order
        Order order1 = Order.builder()
                .orderNumber("ORD-2026-0814-101")
                .customer(customer1)
                .vendorProfile(vendor1)
                .totalAmount(249.99)
                .status(OrderStatus.DELIVERED)
                .shippingAddress("742 Evergreen Terrace, Springfield, OR 97477")
                .createdAt(now.minusDays(5))
                .build();
        order1.setPaymentMethod(PaymentMethod.CARD);
        order1.setPaymentStatus(PaymentStatus.PAID);

        OrderItem item1 = OrderItem.builder()
                .order(order1)
                .product(p1)
                .quantity(1)
                .unitPrice(249.99)
                .subtotal(249.99)
                .build();
        order1.setItems(new ArrayList<>(List.of(item1)));

        // Order 2: Shipped Laptop order
        Order order2 = Order.builder()
                .orderNumber("ORD-2026-0816-102")
                .customer(customer2)
                .vendorProfile(vendor1)
                .totalAmount(1399.00)
                .status(OrderStatus.SHIPPED)
                .shippingAddress("100 Market Street, Suite 400, San Francisco, CA 94105")
                .createdAt(now.minusDays(3))
                .build();
        order2.setPaymentMethod(PaymentMethod.UPI);
        order2.setPaymentStatus(PaymentStatus.PAID);

        OrderItem item2 = OrderItem.builder()
                .order(order2)
                .product(p2)
                .quantity(1)
                .unitPrice(1399.00)
                .subtotal(1399.00)
                .build();
        order2.setItems(new ArrayList<>(List.of(item2)));

        // Order 3: Delivered Fashion order
        Order order3 = Order.builder()
                .orderNumber("ORD-2026-0817-103")
                .customer(customer1)
                .vendorProfile(vendor2)
                .totalAmount(364.99)
                .status(OrderStatus.DELIVERED)
                .shippingAddress("742 Evergreen Terrace, Springfield, OR 97477")
                .createdAt(now.minusDays(2))
                .build();
        order3.setPaymentMethod(PaymentMethod.NETBANKING);
        order3.setPaymentStatus(PaymentStatus.PAID);

        OrderItem item3a = OrderItem.builder()
                .order(order3)
                .product(p3)
                .quantity(1)
                .unitPrice(69.99)
                .subtotal(69.99)
                .build();
        OrderItem item3b = OrderItem.builder()
                .order(order3)
                .product(p4)
                .quantity(1)
                .unitPrice(295.00)
                .subtotal(295.00)
                .build();
        order3.setItems(new ArrayList<>(List.of(item3a, item3b)));

        // Order 4: Processing Home order
        Order order4 = Order.builder()
                .orderNumber("ORD-2026-0818-104")
                .customer(customer2)
                .vendorProfile(vendor1)
                .totalAmount(119.98)
                .status(OrderStatus.PROCESSING)
                .shippingAddress("100 Market Street, Suite 400, San Francisco, CA 94105")
                .createdAt(now.minusDays(1))
                .build();
        order4.setPaymentMethod(PaymentMethod.CARD);
        order4.setPaymentStatus(PaymentStatus.PAID);

        OrderItem item4 = OrderItem.builder()
                .order(order4)
                .product(p5)
                .quantity(2)
                .unitPrice(59.99)
                .subtotal(119.98)
                .build();
        order4.setItems(new ArrayList<>(List.of(item4)));

        // Order 5: Confirmed Fashion order
        Order order5 = Order.builder()
                .orderNumber("ORD-2026-0819-105")
                .customer(customer1)
                .vendorProfile(vendor2)
                .totalAmount(139.98)
                .status(OrderStatus.CONFIRMED)
                .shippingAddress("742 Evergreen Terrace, Springfield, OR 97477")
                .createdAt(now.minusHours(4))
                .build();
        order5.setPaymentMethod(PaymentMethod.UPI);
        order5.setPaymentStatus(PaymentStatus.PAID);

        OrderItem item5 = OrderItem.builder()
                .order(order5)
                .product(p3)
                .quantity(2)
                .unitPrice(69.99)
                .subtotal(139.98)
                .build();
        order5.setItems(new ArrayList<>(List.of(item5)));

        orderRepository.saveAll(List.of(order1, order2, order3, order4, order5));

        // 7. Create Corresponding Payment Records
        Payment pay1 = Payment.builder()
                .razorpayOrderId("order_rzp_mock_101")
                .razorpayPaymentId("pay_rzp_mock_101")
                .razorpaySignature("sig_mock_101")
                .amount(249.99)
                .currency("INR")
                .status(PaymentStatus.PAID)
                .paymentMethod(PaymentMethod.CARD)
                .customer(customer1)
                .orderIdsJson(String.valueOf(order1.getId()))
                .createdAt(now.minusDays(5))
                .updatedAt(now.minusDays(5))
                .build();

        Payment pay2 = Payment.builder()
                .razorpayOrderId("order_rzp_mock_102")
                .razorpayPaymentId("pay_rzp_mock_102")
                .razorpaySignature("sig_mock_102")
                .amount(1399.00)
                .currency("INR")
                .status(PaymentStatus.PAID)
                .paymentMethod(PaymentMethod.UPI)
                .customer(customer2)
                .orderIdsJson(String.valueOf(order2.getId()))
                .createdAt(now.minusDays(3))
                .updatedAt(now.minusDays(3))
                .build();

        Payment pay3 = Payment.builder()
                .razorpayOrderId("order_rzp_mock_103")
                .razorpayPaymentId("pay_rzp_mock_103")
                .razorpaySignature("sig_mock_103")
                .amount(364.99)
                .currency("INR")
                .status(PaymentStatus.PAID)
                .paymentMethod(PaymentMethod.NETBANKING)
                .customer(customer1)
                .orderIdsJson(String.valueOf(order3.getId()))
                .createdAt(now.minusDays(2))
                .updatedAt(now.minusDays(2))
                .build();

        Payment pay4 = Payment.builder()
                .razorpayOrderId("order_rzp_mock_104")
                .razorpayPaymentId("pay_rzp_mock_104")
                .razorpaySignature("sig_mock_104")
                .amount(119.98)
                .currency("INR")
                .status(PaymentStatus.PAID)
                .paymentMethod(PaymentMethod.CARD)
                .customer(customer2)
                .orderIdsJson(String.valueOf(order4.getId()))
                .createdAt(now.minusDays(1))
                .updatedAt(now.minusDays(1))
                .build();

        Payment pay5 = Payment.builder()
                .razorpayOrderId("order_rzp_mock_105")
                .razorpayPaymentId("pay_rzp_mock_105")
                .razorpaySignature("sig_mock_105")
                .amount(139.98)
                .currency("INR")
                .status(PaymentStatus.PAID)
                .paymentMethod(PaymentMethod.UPI)
                .customer(customer1)
                .orderIdsJson(String.valueOf(order5.getId()))
                .createdAt(now.minusHours(4))
                .updatedAt(now.minusHours(4))
                .build();

        paymentRepository.saveAll(List.of(pay1, pay2, pay3, pay4, pay5));

        System.out.println(">>> [ShopStack DataInitializer] Successfully initialized demo marketplace dataset with live orders & payments.");
    }
}
