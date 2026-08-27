import api from './axios';

export const warehouseApi = {
  // Warehouse CRUD
  getAll: () => api.get('/warehouses'),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  toggleStatus: (id) => api.put(`/warehouses/${id}/toggle-status`),
  delete: (id) => api.delete(`/warehouses/${id}`),

  // Inventory & Stock
  getInventoryByWarehouse: (warehouseId) => api.get(`/warehouses/${warehouseId}/inventory`),
  getAllInventory: () => api.get('/warehouses/inventory/all'),
  checkAvailability: (productId, quantity = 1) => api.get(`/warehouses/availability?productId=${productId}&quantity=${quantity}`),
  restock: (warehouseId, data) => api.post(`/warehouses/${warehouseId}/inventory/restock`, data),

  // Allocations & Fulfillment Lifecycle
  getAllocations: (params) => api.get('/warehouses/allocations', { params }),
  autoAllocateOrder: (orderId) => api.post(`/warehouses/allocations/auto-allocate/${orderId}`),
  manualAllocate: (data) => api.post('/warehouses/allocations/manual-allocate', data),
  pickItem: (allocationId, data) => api.post(`/warehouses/allocations/${allocationId}/pick`, data),
  packItem: (allocationId, data) => api.post(`/warehouses/allocations/${allocationId}/pack`, data),
  prepareShipment: (allocationId, data) => api.post(`/warehouses/allocations/${allocationId}/prepare-shipment`, data),
  dispatchItem: (allocationId) => api.post(`/warehouses/allocations/${allocationId}/dispatch`),

  // Audit Logs & Analytics
  getStockMovements: (params) => api.get('/warehouses/stock-movements', { params }),
  getAnalyticsSummary: () => api.get('/warehouses/analytics/summary'),
};
