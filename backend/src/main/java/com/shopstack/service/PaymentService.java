package com.shopstack.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopstack.dto.CreateOrderRequest;
import com.shopstack.dto.PaymentOrderResponse;
import com.shopstack.dto.PaymentVerificationRequest;
import com.shopstack.model.*;
import com.shopstack.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class PaymentService {

    private final RazorpayService razorpayService;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PaymentService(RazorpayService razorpayService, PaymentRepository paymentRepository, OrderRepository orderRepository, ProductRepository productRepository, UserRepository userRepository, VendorProfileRepository vendorProfileRepository) {
        this.razorpayService = razorpayService;
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.vendorProfileRepository = vendorProfileRepository;
    }

    /**
     * Create payment order (Supports COD and Razorpay Online Checkout).
     */
    @Transactional
    public PaymentOrderResponse createPaymentOrder(Long customerId, CreateOrderRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer user not found"));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart items cannot be empty for checkout.");
        }

        PaymentMethod selectedMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CARD;

        // Validate stock and group items by vendor
        Map<Long, List<CreateOrderRequest.OrderItemRequest>> itemsByVendor = new HashMap<>();

        for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with ID: " + itemReq.getProductId()));

            if (product.getStatus() == ProductStatus.OUT_OF_STOCK || product.getStockQuantity() == null || product.getStockQuantity() <= 0) {
                throw new RuntimeException("Product '" + product.getTitle() + "' is Out of Stock!");
            }

            if (product.getStockQuantity() < itemReq.getQuantity()) {
                throw new RuntimeException("Insufficient stock for '" + product.getTitle() + "'. Available stock: "
                        + product.getStockQuantity() + ", Requested quantity: " + itemReq.getQuantity());
            }

            Long vendorId = product.getVendorProfile().getId();
            itemsByVendor.computeIfAbsent(vendorId, k -> new ArrayList<>()).add(itemReq);
        }

        String defaultAddress = "Veerapunayunipalli, Kadapa, Andhra Pradesh, 516321, India";
        String shippingAddress = (request.getShippingAddress() != null && !request.getShippingAddress().isBlank())
                ? request.getShippingAddress() : defaultAddress;

        List<Order> pendingOrders = new ArrayList<>();
        double grandTotalAmount = 0.0;
        List<Long> createdOrderIds = new ArrayList<>();

        for (Map.Entry<Long, List<CreateOrderRequest.OrderItemRequest>> entry : itemsByVendor.entrySet()) {
            Long vendorId = entry.getKey();
            List<CreateOrderRequest.OrderItemRequest> vendorItems = entry.getValue();

            VendorProfile vendor = vendorProfileRepository.findById(vendorId)
                    .orElseThrow(() -> new RuntimeException("Vendor profile not found"));

            String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            double vendorOrderTotal = 0.0;

            Order order = Order.builder()
                    .orderNumber(orderNumber)
                    .customer(customer)
                    .vendorProfile(vendor)
                    .status(OrderStatus.PENDING) // Initial state is PENDING
                    .shippingAddress(shippingAddress)
                    .totalAmount(0.0)
                    .build();

            order.setPaymentMethod(selectedMethod);
            order.setPaymentStatus(selectedMethod == PaymentMethod.COD ? PaymentStatus.PENDING_COD : PaymentStatus.PENDING);

            List<OrderItem> orderItems = new ArrayList<>();

            for (CreateOrderRequest.OrderItemRequest itemReq : vendorItems) {
                Product product = productRepository.findById(itemReq.getProductId()).get();
                double unitPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
                double subtotal = unitPrice * itemReq.getQuantity();
                vendorOrderTotal += subtotal;

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .product(product)
                        .quantity(itemReq.getQuantity())
                        .unitPrice(unitPrice)
                        .subtotal(subtotal)
                        .build();

                orderItems.add(orderItem);
            }

            double roundedTotal = Math.round(vendorOrderTotal * 100.0) / 100.0;
            order.setTotalAmount(roundedTotal);
            order.setItems(orderItems);

            Order savedOrder = orderRepository.save(order);
            pendingOrders.add(savedOrder);
            createdOrderIds.add(savedOrder.getId());

            grandTotalAmount += roundedTotal;
        }

        grandTotalAmount = Math.round(grandTotalAmount * 100.0) / 100.0;

        // Cash on Delivery Flow (No Razorpay call, stock NOT deducted yet)
        if (selectedMethod == PaymentMethod.COD) {
            String codOrderId = "COD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            try {
                String orderIdsJson = objectMapper.writeValueAsString(createdOrderIds);
                Payment payment = Payment.builder()
                        .razorpayOrderId(codOrderId)
                        .amount(grandTotalAmount)
                        .currency("INR")
                        .status(PaymentStatus.PENDING_COD)
                        .customer(customer)
                        .orderIdsJson(orderIdsJson)
                        .build();
                payment.setPaymentMethod(PaymentMethod.COD);

                paymentRepository.save(payment);
            } catch (Exception e) {
                throw new RuntimeException("Error saving COD payment state: " + e.getMessage());
            }

            PaymentOrderResponse response = new PaymentOrderResponse(
                    codOrderId,
                    "COD_MODE",
                    0L,
                    grandTotalAmount,
                    "INR",
                    "PENDING_COD",
                    createdOrderIds
            );
            response.setPaymentMethod("COD");
            return response;
        }

        // Online Payment Flow (Cards / UPI / Netbanking via Razorpay)
        String receiptId = "RCP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String razorpayOrderId = razorpayService.createRazorpayOrder(grandTotalAmount, receiptId);

        try {
            String orderIdsJson = objectMapper.writeValueAsString(createdOrderIds);
            Payment payment = Payment.builder()
                    .razorpayOrderId(razorpayOrderId)
                    .amount(grandTotalAmount)
                    .currency(razorpayService.getCurrency())
                    .status(PaymentStatus.PENDING)
                    .customer(customer)
                    .orderIdsJson(orderIdsJson)
                    .build();
            payment.setPaymentMethod(selectedMethod);

            paymentRepository.save(payment);
        } catch (Exception e) {
            throw new RuntimeException("Error saving payment order state: " + e.getMessage());
        }

        long amountInPaise = Math.round(grandTotalAmount * 100);

        PaymentOrderResponse response = new PaymentOrderResponse(
                razorpayOrderId,
                razorpayService.getKeyId(),
                amountInPaise,
                grandTotalAmount,
                razorpayService.getCurrency(),
                "PENDING",
                createdOrderIds
        );
        response.setPaymentMethod(selectedMethod.name());
        return response;
    }

    /**
     * Verify payment signature and update order & inventory state safely (IDEMPOTENT).
     */
    @Transactional
    public Payment verifyAndProcessPayment(PaymentVerificationRequest request) {
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Payment record not found for Razorpay Order ID: " + request.getRazorpayOrderId()));

        // Idempotency check: If already paid, return without re-deducting stock or re-processing
        if (payment.getStatus() == PaymentStatus.PAID) {
            return payment;
        }

        // Verify Razorpay signature
        boolean isValidSignature = razorpayService.verifySignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (!isValidSignature) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Razorpay payment signature verification failed.");
            paymentRepository.save(payment);
            throw new RuntimeException("Payment verification failed! Invalid Razorpay signature.");
        }

        // Mark payment as PAID
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(PaymentStatus.PAID);
        Payment savedPayment = paymentRepository.save(payment);

        // Parse order IDs
        List<Long> orderIds = parseOrderIds(payment.getOrderIdsJson());

        // Update orders to CONFIRMED and deduct inventory stock EXACTLY ONCE
        for (Long orderId : orderIds) {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null && order.getStatus() == OrderStatus.PENDING) {
                order.setStatus(OrderStatus.CONFIRMED);
                order.setPaymentStatus(PaymentStatus.PAID);

                for (OrderItem item : order.getItems()) {
                    Product product = item.getProduct();
                    int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                    int newStock = Math.max(0, currentStock - item.getQuantity());

                    product.setStockQuantity(newStock);
                    if (newStock <= 0) {
                        product.setStatus(ProductStatus.OUT_OF_STOCK);
                    }
                    productRepository.save(product);
                }

                orderRepository.save(order);
            }
        }

        return savedPayment;
    }

    @Transactional
    public Payment handlePaymentFailure(String razorpayOrderId, String reason) {
        Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new RuntimeException("Payment record not found for order: " + razorpayOrderId));

        if (payment.getStatus() != PaymentStatus.PAID) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(reason != null ? reason : "Payment cancelled or failed by customer.");
            paymentRepository.save(payment);
        }
        return payment;
    }

    public List<Payment> getCustomerPayments(Long customerId) {
        return paymentRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    private List<Long> parseOrderIds(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Long>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
