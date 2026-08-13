package com.shopstack.dto;

public class AdminStatsResponse {
    private long totalProducts;
    private long totalCustomers;
    private long totalVendors;
    private long totalOrders;
    private long paidTransactions;
    private double totalRevenue;
    private long pendingOrders;

    public AdminStatsResponse() {}

    public AdminStatsResponse(long totalProducts, long totalCustomers, long totalVendors, long totalOrders, long paidTransactions, double totalRevenue, long pendingOrders) {
        this.totalProducts = totalProducts;
        this.totalCustomers = totalCustomers;
        this.totalVendors = totalVendors;
        this.totalOrders = totalOrders;
        this.paidTransactions = paidTransactions;
        this.totalRevenue = totalRevenue;
        this.pendingOrders = pendingOrders;
    }

    public long getTotalProducts() { return totalProducts; }
    public void setTotalProducts(long totalProducts) { this.totalProducts = totalProducts; }

    public long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }

    public long getTotalVendors() { return totalVendors; }
    public void setTotalVendors(long totalVendors) { this.totalVendors = totalVendors; }

    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

    public long getPaidTransactions() { return paidTransactions; }
    public void setPaidTransactions(long paidTransactions) { this.paidTransactions = paidTransactions; }

    public double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; }

    public long getPendingOrders() { return pendingOrders; }
    public void setPendingOrders(long pendingOrders) { this.pendingOrders = pendingOrders; }
}
