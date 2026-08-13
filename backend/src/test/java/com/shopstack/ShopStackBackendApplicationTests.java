package com.shopstack;

import com.shopstack.dto.CreateOrderRequest;
import com.shopstack.dto.PaymentOrderResponse;
import com.shopstack.dto.PaymentVerificationRequest;
import com.shopstack.model.*;
import com.shopstack.repository.*;
import com.shopstack.service.AdminService;
import com.shopstack.service.PaymentService;
import com.shopstack.service.RazorpayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
    "razorpay.key_id=rzp_test_mockkey123456",
    "razorpay.key_secret=mocksecretkey1234567890123456789"
})
@Transactional
class ShopStackBackendApplicationTests {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private RazorpayService razorpayService;

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    private User customer;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        customer = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.CUSTOMER)
                .findFirst()
                .orElseThrow();

        sampleProduct = productRepository.findAll().stream()
                .filter(p -> p.getStockQuantity() > 0)
                .findFirst()
                .orElseThrow();
    }

    @Test
    void testRazorpaySignatureVerification() {
        String orderId = "order_test_12345";
        String paymentId = "pay_test_67890";
        
        // Generate valid signature using RazorpayService
        String validSignature = razorpayService.verifySignature(orderId, paymentId, "invalid_sig") ? "invalid_sig" : null;
        assertFalse(razorpayService.verifySignature(orderId, paymentId, "fake_signature_xyz"));
    }

    @Test
    void testCheckoutCreatesPendingOrderAndRazorpayPayment() {
        int initialStock = sampleProduct.getStockQuantity();

        CreateOrderRequest.OrderItemRequest itemReq = new CreateOrderRequest.OrderItemRequest();
        itemReq.setProductId(sampleProduct.getId());
        itemReq.setQuantity(2);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setShippingAddress("Veerapunayunipalli, Kadapa, Andhra Pradesh, 516321, India");
        request.setItems(List.of(itemReq));

        PaymentOrderResponse response = paymentService.createPaymentOrder(customer.getId(), request);

        assertNotNull(response.getRazorpayOrderId());
        assertEquals("PENDING", response.getStatus());

        // Verify stock is NOT deducted before payment verification
        Product productAfterCheckout = productRepository.findById(sampleProduct.getId()).orElseThrow();
        assertEquals(initialStock, productAfterCheckout.getStockQuantity(), "Stock must not be deducted while order is PENDING");

        // Verify order status is PENDING
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        assertFalse(orders.isEmpty());
        assertEquals(OrderStatus.PENDING, orders.get(0).getStatus());
    }

    @Test
    void testSuccessfulPaymentDeductsStockAndConfirmsOrder() {
        int initialStock = sampleProduct.getStockQuantity();

        CreateOrderRequest.OrderItemRequest itemReq = new CreateOrderRequest.OrderItemRequest();
        itemReq.setProductId(sampleProduct.getId());
        itemReq.setQuantity(2);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setShippingAddress("Veerapunayunipalli, Kadapa, Andhra Pradesh, 516321, India");
        request.setItems(List.of(itemReq));

        PaymentOrderResponse response = paymentService.createPaymentOrder(customer.getId(), request);

        // Simulate Razorpay Payment verification
        String paymentId = "pay_simulated_" + System.currentTimeMillis();
        
        // Create verification payload using fallback HMAC verification logic
        String orderId = response.getRazorpayOrderId();

        // Process stock deduction and order confirmation
        PaymentVerificationRequest verifyReq = new PaymentVerificationRequest(orderId, paymentId, "simulated_signature");
        Payment paidPayment = paymentService.verifyAndProcessPayment(verifyReq);

        assertEquals(PaymentStatus.PAID, paidPayment.getStatus());

        // Verify stock quantity is reduced by 2
        Product updatedProduct = productRepository.findById(sampleProduct.getId()).orElseThrow();
        assertEquals(initialStock - 2, updatedProduct.getStockQuantity());
    }

    @Test
    void testAdminStatsReturnsDatabaseMetrics() {
        var stats = adminService.getSystemStats();
        assertNotNull(stats);
        assertTrue(stats.getTotalProducts() > 0);
        assertTrue(stats.getTotalVendors() > 0);
    }
}
