package com.shopstack.service;

import com.shopstack.dto.CreateOrderRequest;
import com.shopstack.model.*;
import com.shopstack.repository.OrderRepository;
import com.shopstack.repository.ProductRepository;
import com.shopstack.repository.UserRepository;
import com.shopstack.repository.VendorProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final VendorProfileRepository vendorProfileRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository, UserRepository userRepository, VendorProfileRepository vendorProfileRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.vendorProfileRepository = vendorProfileRepository;
    }

    @Transactional
    public List<Order> createOrders(Long customerId, CreateOrderRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart items cannot be empty.");
        }

        // Group order items by vendor
        Map<Long, List<CreateOrderRequest.OrderItemRequest>> itemsByVendor = new HashMap<>();

        for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with ID: " + itemReq.getProductId()));

            // Stock Check
            if (product.getStockQuantity() == null || product.getStockQuantity() <= 0) {
                throw new RuntimeException("Product '" + product.getTitle() + "' is Out of Stock!");
            }

            if (product.getStockQuantity() < itemReq.getQuantity()) {
                throw new RuntimeException("Insufficient stock for '" + product.getTitle() + "'. Available: "
                        + product.getStockQuantity() + ", Requested: " + itemReq.getQuantity());
            }

            Long vendorId = product.getVendorProfile().getId();
            itemsByVendor.computeIfAbsent(vendorId, k -> new ArrayList<>()).add(itemReq);
        }

        List<Order> createdOrders = new ArrayList<>();

        for (Map.Entry<Long, List<CreateOrderRequest.OrderItemRequest>> entry : itemsByVendor.entrySet()) {
            Long vendorId = entry.getKey();
            List<CreateOrderRequest.OrderItemRequest> vendorItems = entry.getValue();

            VendorProfile vendor = vendorProfileRepository.findById(vendorId)
                    .orElseThrow(() -> new RuntimeException("Vendor profile not found"));

            String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            double totalAmount = 0.0;
            List<OrderItem> orderItems = new ArrayList<>();

            Order order = Order.builder()
                    .orderNumber(orderNumber)
                    .customer(customer)
                    .vendorProfile(vendor)
                    .status(OrderStatus.CONFIRMED)
                    .shippingAddress(request.getShippingAddress() != null ? request.getShippingAddress() : "Standard Delivery Address")
                    .totalAmount(0.0)
                    .build();

            for (CreateOrderRequest.OrderItemRequest itemReq : vendorItems) {
                Product product = productRepository.findById(itemReq.getProductId()).get();
                double unitPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
                double subtotal = unitPrice * itemReq.getQuantity();
                totalAmount += subtotal;

                // Reduce stock quantity
                int newStock = product.getStockQuantity() - itemReq.getQuantity();
                product.setStockQuantity(newStock);
                if (newStock <= 0) {
                    product.setStatus(ProductStatus.OUT_OF_STOCK);
                }
                productRepository.save(product);

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .product(product)
                        .quantity(itemReq.getQuantity())
                        .unitPrice(unitPrice)
                        .subtotal(subtotal)
                        .build();

                orderItems.add(orderItem);
            }

            order.setTotalAmount(Math.round(totalAmount * 100.0) / 100.0);
            order.setItems(orderItems);

            Order savedOrder = orderRepository.save(order);
            createdOrders.add(savedOrder);
        }

        return createdOrders;
    }

    public List<Order> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    public List<Order> getOrdersByVendor(Long vendorId) {
        return orderRepository.findByVendorProfileIdOrderByCreatedAtDesc(vendorId);
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));
        order.setStatus(status);
        return orderRepository.save(order);
    }
}
