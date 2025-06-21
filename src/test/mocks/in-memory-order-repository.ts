import { Order } from '@/domain/order/order';
import { OrderRepository } from '@/domain/order/order-repository';
import { Maybe } from '@/domain/shared/functional';

/**
 * In-memory implementation of OrderRepository for testing purposes.
 * Provides a fast, isolated storage mechanism without external dependencies.
 */
export class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();
  private customerIndex: Map<string, string[]> = new Map(); // customerId -> orderIds[]
  private orderNumberIndex: Map<string, string> = new Map(); // orderNumber -> orderId
  private statusIndex: Map<string, string[]> = new Map(); // status -> orderIds[]

  async save(order: Order): Promise<void> {
    const orderId = order.getId();
    const customerId = order.getCustomerId();
    const orderNumber = order.getOrderNumber();
    const status = order.getStatus();

    // Update customer index
    if (!this.customerIndex.has(customerId)) {
      this.customerIndex.set(customerId, []);
    }
    const customerOrders = this.customerIndex.get(customerId)!;
    if (!customerOrders.includes(orderId)) {
      customerOrders.push(orderId);
    }

    // Update order number index
    this.orderNumberIndex.set(orderNumber, orderId);

    // Update status index
    if (!this.statusIndex.has(status)) {
      this.statusIndex.set(status, []);
    }
    const statusOrders = this.statusIndex.get(status)!;
    if (!statusOrders.includes(orderId)) {
      statusOrders.push(orderId);
    }

    // Store order
    this.orders.set(orderId, order);
  }

  async findById(id: string): Promise<Maybe<Order>> {
    const order = this.orders.get(id);
    return order ? Maybe.some(order) : Maybe.none();
  }

  async findByOrderNumber(orderNumber: string): Promise<Maybe<Order>> {
    const orderId = this.orderNumberIndex.get(orderNumber);
    
    if (!orderId) {
      return Maybe.none();
    }

    const order = this.orders.get(orderId);
    return order ? Maybe.some(order) : Maybe.none();
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const orderIds = this.customerIndex.get(customerId) || [];
    return orderIds
      .map(id => this.orders.get(id))
      .filter((order): order is Order => order !== undefined);
  }

  async findByStatus(status: string): Promise<Order[]> {
    const orderIds = this.statusIndex.get(status) || [];
    return orderIds
      .map(id => this.orders.get(id))
      .filter((order): order is Order => order !== undefined);
  }

  async findActiveOrders(): Promise<Order[]> {
    const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'];
    const activeOrders: Order[] = [];

    for (const status of activeStatuses) {
      const orders = await this.findByStatus(status);
      activeOrders.push(...orders);
    }

    return activeOrders;
  }

  async findOrdersCreatedBetween(startDate: Date, endDate: Date): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => {
      const createdAt = order.getCreatedAt();
      return createdAt >= startDate && createdAt <= endDate;
    });
  }

  async findOrdersWithDeliveryBetween(startDate: Date, endDate: Date): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => {
      const estimatedDelivery = order.getEstimatedDeliveryTime();
      return estimatedDelivery >= startDate && estimatedDelivery <= endDate;
    });
  }

  async countOrdersByStatus(status: string): Promise<number> {
    const orders = await this.findByStatus(status);
    return orders.length;
  }

  async countOrdersByCustomer(customerId: string): Promise<number> {
    const orders = await this.findByCustomerId(customerId);
    return orders.length;
  }

  async getTotalRevenue(): Promise<number> {
    return Array.from(this.orders.values())
      .filter(order => order.getStatus() === 'delivered')
      .reduce((total, order) => total + order.getTotal().getAmount(), 0);
  }

  async getRevenueByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return Array.from(this.orders.values())
      .filter(order => {
        const createdAt = order.getCreatedAt();
        return order.getStatus() === 'delivered' && 
               createdAt >= startDate && 
               createdAt <= endDate;
      })
      .reduce((total, order) => total + order.getTotal().getAmount(), 0);
  }

  async delete(id: string): Promise<void> {
    const order = this.orders.get(id);
    
    if (order) {
      const customerId = order.getCustomerId();
      const orderNumber = order.getOrderNumber();
      const status = order.getStatus();

      // Remove from customer index
      const customerOrders = this.customerIndex.get(customerId);
      if (customerOrders) {
        const index = customerOrders.indexOf(id);
        if (index > -1) {
          customerOrders.splice(index, 1);
        }
        if (customerOrders.length === 0) {
          this.customerIndex.delete(customerId);
        }
      }

      // Remove from order number index
      this.orderNumberIndex.delete(orderNumber);

      // Remove from status index
      const statusOrders = this.statusIndex.get(status);
      if (statusOrders) {
        const index = statusOrders.indexOf(id);
        if (index > -1) {
          statusOrders.splice(index, 1);
        }
        if (statusOrders.length === 0) {
          this.statusIndex.delete(status);
        }
      }

      // Remove order
      this.orders.delete(id);
    }
  }

  /**
   * Test utility methods
   */
  
  /**
   * Clear all stored data. Useful for test cleanup.
   */
  clear(): void {
    this.orders.clear();
    this.customerIndex.clear();
    this.orderNumberIndex.clear();
    this.statusIndex.clear();
  }

  /**
   * Get all stored orders. Useful for testing.
   */
  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  /**
   * Get order count. Useful for testing.
   */
  size(): number {
    return this.orders.size;
  }

  /**
   * Check if an order exists by ID. Useful for testing.
   */
  hasOrder(id: string): boolean {
    return this.orders.has(id);
  }

  /**
   * Get internal state for debugging. Useful for testing.
   */
  getInternalState(): {
    orderCount: number;
    customerIndexSize: number;
    orderNumberIndexSize: number;
    statusIndexSize: number;
    statuses: string[];
    customerIds: string[];
  } {
    return {
      orderCount: this.orders.size,
      customerIndexSize: this.customerIndex.size,
      orderNumberIndexSize: this.orderNumberIndex.size,
      statusIndexSize: this.statusIndex.size,
      statuses: Array.from(this.statusIndex.keys()),
      customerIds: Array.from(this.customerIndex.keys())
    };
  }

  /**
   * Simulate database transaction for testing complex scenarios.
   */
  async transaction<T>(operation: () => Promise<T>): Promise<T> {
    // Save current state
    const orderBackup = new Map(this.orders);
    const customerBackup = new Map(this.customerIndex);
    const orderNumberBackup = new Map(this.orderNumberIndex);
    const statusBackup = new Map(this.statusIndex);

    try {
      return await operation();
    } catch (error) {
      // Rollback on error
      this.orders = orderBackup;
      this.customerIndex = customerBackup;
      this.orderNumberIndex = orderNumberBackup;
      this.statusIndex = statusBackup;
      throw error;
    }
  }

  /**
   * Simulate database connection issues for testing error handling.
   */
  private simulateConnectionError = false;

  simulateConnectionFailure(): void {
    this.simulateConnectionError = true;
  }

  restoreConnection(): void {
    this.simulateConnectionError = false;
  }

  private checkConnection(): void {
    if (this.simulateConnectionError) {
      throw new Error('Simulated database connection error');
    }
  }

  /**
   * Seed the repository with test data
   */
  async seed(orders: Order[]): Promise<void> {
    for (const order of orders) {
      await this.save(order);
    }
  }

  /**
   * Create a snapshot of current state for comparison testing
   */
  createSnapshot(): {
    orders: Array<{
      id: string;
      orderNumber: string;
      customerId: string;
      status: string;
      total: number;
      itemCount: number;
      createdAt: Date;
      estimatedDeliveryTime: Date;
    }>;
  } {
    return {
      orders: Array.from(this.orders.values()).map(order => ({
        id: order.getId(),
        orderNumber: order.getOrderNumber(),
        customerId: order.getCustomerId(),
        status: order.getStatus(),
        total: order.getTotal().getAmount(),
        itemCount: order.getItems().length,
        createdAt: order.getCreatedAt(),
        estimatedDeliveryTime: order.getEstimatedDeliveryTime()
      }))
    };
  }

  /**
   * Simulate slow database operations for performance testing
   */
  private simulateDelay = 0;

  setSimulatedDelay(milliseconds: number): void {
    this.simulateDelay = milliseconds;
  }

  private async delay(): Promise<void> {
    if (this.simulateDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.simulateDelay));
    }
  }

  async saveWithDelay(order: Order): Promise<void> {
    await this.delay();
    return this.save(order);
  }

  async findByIdWithDelay(id: string): Promise<Maybe<Order>> {
    await this.delay();
    return this.findById(id);
  }

  /**
   * Find orders with specific pizza types (for analytics)
   */
  async findOrdersWithPizza(pizzaId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => 
      order.getItems().some(item => item.pizzaId === pizzaId)
    );
  }

  /**
   * Get popular pizzas by order frequency
   */
  async getPopularPizzas(limit: number = 10): Promise<Array<{ pizzaId: string; orderCount: number }>> {
    const pizzaCounts = new Map<string, number>();

    for (const order of this.orders.values()) {
      for (const item of order.getItems()) {
        const current = pizzaCounts.get(item.pizzaId) || 0;
        pizzaCounts.set(item.pizzaId, current + item.quantity);
      }
    }

    return Array.from(pizzaCounts.entries())
      .map(([pizzaId, orderCount]) => ({ pizzaId, orderCount }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, limit);
  }

  /**
   * Get average order value
   */
  async getAverageOrderValue(): Promise<number> {
    const orders = Array.from(this.orders.values());
    if (orders.length === 0) return 0;

    const total = orders.reduce((sum, order) => sum + order.getTotal().getAmount(), 0);
    return total / orders.length;
  }

  /**
   * Get customer order statistics
   */
  async getCustomerStats(customerId: string): Promise<{
    orderCount: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: Date;
    favoriteStatus: string;
  }> {
    const customerOrders = await this.findByCustomerId(customerId);
    
    if (customerOrders.length === 0) {
      return {
        orderCount: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        favoriteStatus: 'new'
      };
    }

    const totalSpent = customerOrders.reduce((sum, order) => sum + order.getTotal().getAmount(), 0);
    const averageOrderValue = totalSpent / customerOrders.length;
    const lastOrderDate = customerOrders
      .map(order => order.getCreatedAt())
      .sort((a, b) => b.getTime() - a.getTime())[0];

    let favoriteStatus = 'regular';
    if (customerOrders.length >= 10) favoriteStatus = 'vip';
    else if (customerOrders.length >= 5) favoriteStatus = 'loyal';

    return {
      orderCount: customerOrders.length,
      totalSpent,
      averageOrderValue,
      lastOrderDate,
      favoriteStatus
    };
  }
}
