package com.shopstack.service;

import com.shopstack.dto.AdminStatsResponse;
import com.shopstack.model.OrderStatus;
import com.shopstack.model.Role;
import com.shopstack.model.User;
import com.shopstack.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    public AdminService(ProductRepository productRepository, UserRepository userRepository, VendorProfileRepository vendorProfileRepository, OrderRepository orderRepository, PaymentRepository paymentRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.vendorProfileRepository = vendorProfileRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
    }

    public AdminStatsResponse getSystemStats() {
        long totalProducts = productRepository.count();
        long totalCustomers = userRepository.findAll().stream().filter(u -> u.getRole() == Role.CUSTOMER).count();
        long totalVendors = vendorProfileRepository.count();
        long totalOrders = orderRepository.count();
        long paidTransactions = paymentRepository.countPaidTransactions();
        Double revenue = paymentRepository.calculateTotalPaidRevenue();
        double totalRevenue = revenue != null ? revenue : 0.0;
        long pendingOrders = orderRepository.findAll().stream().filter(o -> o.getStatus() == OrderStatus.PENDING).count();

        return new AdminStatsResponse(
                totalProducts,
                totalCustomers,
                totalVendors,
                totalOrders,
                paidTransactions,
                Math.round(totalRevenue * 100.0) / 100.0,
                pendingOrders
        );
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public User toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        user.setEnabled(!Boolean.TRUE.equals(user.getEnabled()));
        return userRepository.save(user);
    }
}
