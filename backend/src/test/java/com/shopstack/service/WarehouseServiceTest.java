package com.shopstack.service;

import com.shopstack.dto.*;
import com.shopstack.model.*;
import com.shopstack.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
class WarehouseServiceTest {

    @Autowired
    private WarehouseService warehouseService;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private WarehouseInventoryRepository inventoryRepository;

    @Autowired
    private OrderWarehouseAllocationRepository allocationRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VendorProfileRepository vendorProfileRepository;

    private Warehouse hydWarehouse;
    private Product testProduct;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        hydWarehouse = warehouseRepository.findByCode("WH-HYD-01")
                .orElseGet(() -> warehouseRepository.findAll().get(0));

        testProduct = productRepository.findAll().get(0);
        testOrder = orderRepository.findAll().get(0);
    }

    @Test
    @DisplayName("1. Warehouse Management - List all warehouses and verify metrics")
    void testGetAllWarehouses() {
        List<WarehouseDTO> warehouses = warehouseService.getAllWarehouses();
        assertNotNull(warehouses);
        assertFalse(warehouses.isEmpty());

        WarehouseDTO first = warehouses.get(0);
        assertNotNull(first.getCode());
        assertNotNull(first.getName());
        assertNotNull(first.getCapacity());
        assertTrue(first.getCapacity() > 0);
    }

    @Test
    @DisplayName("2. Warehouse Management - Create, update and toggle status of warehouse")
    void testCreateAndUpdateWarehouse() {
        WarehouseRequest req = new WarehouseRequest();
        req.setCode("WH-PUN-01");
        req.setName("Pune Regional Fulfillment Depot");
        req.setCity("Pune");
        req.setState("Maharashtra");
        req.setCapacity(40000);
        req.setActive(true);

        WarehouseDTO created = warehouseService.createWarehouse(req);
        assertNotNull(created.getId());
        assertEquals("WH-PUN-01", created.getCode());
        assertEquals("Pune Regional Fulfillment Depot", created.getName());

        // Update
        req.setName("Pune Express Mega Hub");
        WarehouseDTO updated = warehouseService.updateWarehouse(created.getId(), req);
        assertEquals("Pune Express Mega Hub", updated.getName());

        // Toggle Status
        WarehouseDTO toggled = warehouseService.toggleWarehouseStatus(created.getId());
        assertFalse(toggled.getActive());
    }

    @Test
    @DisplayName("3. Inventory Restock - Restock product in warehouse and verify stock movement log")
    void testRestockProduct() {
        RestockRequest restock = new RestockRequest();
        restock.setProductId(testProduct.getId());
        restock.setQuantity(20);
        restock.setAisleLocation("Aisle 09, Bay C-11");
        restock.setNotes("Supplier restock shipment arrival");
        restock.setPerformedBy("Inventory Lead");

        WarehouseInventoryDTO inv = warehouseService.restockProduct(hydWarehouse.getId(), restock);
        assertNotNull(inv);
        assertTrue(inv.getAvailableStock() >= 20);

        // Verify stock movement logged
        List<StockMovementDTO> movements = warehouseService.getStockMovements(hydWarehouse.getId(), testProduct.getId(), null, StockMovementStage.RESTOCKED);
        assertFalse(movements.isEmpty());
        assertEquals(StockMovementType.INBOUND_RESTOCK, movements.get(0).getMovementType());
        assertEquals(20, movements.get(0).getQuantity());
    }

    @Test
    @DisplayName("4. Availability Check - Query stock availability across active warehouses")
    void testCheckProductAvailability() {
        List<WarehouseInventoryDTO> available = warehouseService.checkAvailability(testProduct.getId(), 1);
        assertNotNull(available);
        assertFalse(available.isEmpty());
        assertTrue(available.get(0).getAvailableStock() >= 1);
    }

    @Test
    @DisplayName("5. Complete Fulfillment Lifecycle: Order Allocation -> Pick -> Pack -> Prepare Shipment -> Dispatch")
    void testCompleteFulfillmentWorkflow() {
        // Step A: Create fresh order
        User customer = userRepository.findAll().stream().filter(u -> u.getRole() == Role.CUSTOMER).findFirst().get();
        VendorProfile vendor = vendorProfileRepository.findAll().get(0);

        Order order = Order.builder()
                .orderNumber("ORD-TEST-" + System.currentTimeMillis())
                .customer(customer)
                .vendorProfile(vendor)
                .status(OrderStatus.CONFIRMED)
                .shippingAddress("123 Tech Park, Hyderabad, India")
                .totalAmount(199.99)
                .build();

        OrderItem item = OrderItem.builder()
                .order(order)
                .product(testProduct)
                .quantity(1)
                .unitPrice(199.99)
                .subtotal(199.99)
                .build();

        order.setItems(new java.util.ArrayList<>(List.of(item)));
        Order savedOrder = orderRepository.save(order);

        // Step B: Allocate Order
        List<OrderWarehouseAllocationDTO> allocations = warehouseService.allocateOrder(savedOrder);
        assertNotNull(allocations);
        assertEquals(1, allocations.size());

        OrderWarehouseAllocationDTO alloc = allocations.get(0);
        assertEquals(StockMovementStage.ALLOCATED, alloc.getStage());
        assertNotNull(alloc.getWarehouseCode());
        assertNotNull(alloc.getAisleLocation());

        Long allocId = alloc.getId();

        // Step C: Pick Item
        PickRequest pickReq = new PickRequest("Rahul Varma", "Item picked from aisle bin cleanly");
        OrderWarehouseAllocationDTO picked = warehouseService.pickOrderItem(allocId, pickReq);
        assertEquals(StockMovementStage.PICKED, picked.getStage());
        assertEquals("Rahul Varma", picked.getPickerName());
        assertNotNull(picked.getPickedAt());

        // Step D: Pack Item
        PackRequest packReq = new PackRequest();
        packReq.setPackerName("Sunita Devi");
        packReq.setBoxType("Eco Carton Box B2");
        packReq.setBoxDimension("25x20x15 cm");
        packReq.setPackageWeightKg(0.95);
        packReq.setNotes("Verified tamper seal applied");

        OrderWarehouseAllocationDTO packed = warehouseService.packOrderItem(allocId, packReq);
        assertEquals(StockMovementStage.PACKED, packed.getStage());
        assertEquals("Sunita Devi", packed.getPackerName());
        assertNotNull(packed.getPackingSlipNumber());
        assertEquals("Eco Carton Box B2", packed.getBoxType());

        // Step E: Prepare Shipment (Ready for Shipment)
        ShipmentPreparationRequest prepReq = new ShipmentPreparationRequest();
        prepReq.setCarrier("BlueDart Express");
        prepReq.setTrackingNumber("TRK-BLD-882910");
        prepReq.setNotes("Air express manifest generated");

        OrderWarehouseAllocationDTO readyShip = warehouseService.prepareShipment(allocId, prepReq);
        assertEquals(StockMovementStage.READY_FOR_SHIPMENT, readyShip.getStage());
        assertEquals("BlueDart Express", readyShip.getCarrier());
        assertEquals("TRK-BLD-882910", readyShip.getTrackingNumber());
        assertNotNull(readyShip.getReadyForShipmentAt());

        // Step F: Dispatch Shipment
        OrderWarehouseAllocationDTO dispatched = warehouseService.dispatchShipment(allocId);
        assertEquals(StockMovementStage.SHIPPED, dispatched.getStage());
        assertNotNull(dispatched.getDispatchedAt());

        // Verify Order status transitioned to SHIPPED
        Order refreshedOrder = orderRepository.findById(savedOrder.getId()).get();
        assertEquals(OrderStatus.SHIPPED, refreshedOrder.getStatus());

        // Verify complete stock movement audit trail for this order
        List<StockMovementDTO> movements = warehouseService.getStockMovements(null, null, savedOrder.getId(), null);
        assertNotNull(movements);
        assertTrue(movements.size() >= 4); // ALLOCATED, PICKED, PACKED, READY_FOR_SHIPMENT, SHIPPED
    }

    @Test
    @DisplayName("6. Warehouse Analytics - Summary aggregation metrics")
    void testWarehouseAnalytics() {
        WarehouseAnalyticsDTO analytics = warehouseService.getWarehouseAnalytics();
        assertNotNull(analytics);
        assertTrue(analytics.getTotalWarehouses() >= 4);
        assertTrue(analytics.getTotalStorageCapacity() > 0);
        assertTrue(analytics.getTotalStoredStock() > 0);
        assertNotNull(analytics.getPipelineStageCounts());
        assertTrue(analytics.getTotalStockMovements() > 0);
    }
}
