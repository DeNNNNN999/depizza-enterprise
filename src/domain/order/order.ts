import { z } from 'zod';
import { BaseAggregateRoot, ID, DomainEvent } from '../shared/types';
import { Money } from '../shared/money';
import { ValidationError, Result, Ok, Err, BusinessRuleViolationError } from '../shared/result';
import { Pizza } from '../menu/pizza';

export const OrderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const PaymentStatusSchema = z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const DeliveryTypeSchema = z.enum(['PICKUP', 'DELIVERY']);
export type DeliveryType = z.infer<typeof DeliveryTypeSchema>;

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  additionalInfo?: string;
}

export interface OrderItem {
  pizza: Pizza;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface OrderProps {
  id: ID;
  customerId?: ID;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  deliveryType: DeliveryType;
  deliveryAddress?: Address;
  specialInstructions?: string;
  requestedDeliveryTime?: Date;
}

export class OrderCreatedEvent implements DomainEvent {
  constructor(
    public readonly eventId: ID,
    public readonly orderId: ID,
    public readonly customerId: ID | null,
    public readonly totalAmount: Money,
    public readonly occurredOn: Date = new Date(),
    public readonly eventVersion: number = 1
  ) {}
}

export class OrderStatusChangedEvent implements DomainEvent {
  constructor(
    public readonly eventId: ID,
    public readonly orderId: ID,
    public readonly previousStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
    public readonly occurredOn: Date = new Date(),
    public readonly eventVersion: number = 1
  ) {}
}

export class Order extends BaseAggregateRoot {
  private _status: OrderStatus = 'PENDING';
  private _paymentStatus: PaymentStatus = 'PENDING';
  private _estimatedDeliveryTime?: Date;

  private constructor(
    id: ID,
    public readonly customerId: ID | null,
    public readonly customerInfo: CustomerInfo,
    public readonly items: OrderItem[],
    public readonly deliveryType: DeliveryType,
    public readonly deliveryAddress: Address | null,
    public readonly specialInstructions: string | null,
    public readonly requestedDeliveryTime: Date | null,
    public readonly totalAmount: Money,
    public readonly tax: Money,
    public readonly deliveryFee: Money
  ) {
    super(id);
  }

  static create(props: OrderProps): Result<Order, ValidationError> {
    const validation = Order.validateOrderProps(props);
    if (validation.isErr()) {
      return validation;
    }

    const totalAmount = Order.calculateTotalAmount(props.items);
    const tax = Order.calculateTax(totalAmount);
    const deliveryFee = Order.calculateDeliveryFee(props.deliveryType, props.deliveryAddress);

    const order = new Order(
      props.id,
      props.customerId || null,
      props.customerInfo,
      props.items,
      props.deliveryType,
      props.deliveryAddress || null,
      props.specialInstructions || null,
      props.requestedDeliveryTime || null,
      totalAmount,
      tax,
      deliveryFee
    );

    order.addDomainEvent(
      new OrderCreatedEvent(
        crypto.randomUUID(),
        order.id,
        order.customerId,
        order.grandTotal
      )
    );

    return Ok(order);
  }

  get status(): OrderStatus {
    return this._status;
  }

  get paymentStatus(): PaymentStatus {
    return this._paymentStatus;
  }

  get estimatedDeliveryTime(): Date | null {
    return this._estimatedDeliveryTime || null;
  }

  get grandTotal(): Money {
    return this.totalAmount.add(this.tax).add(this.deliveryFee);
  }

  confirm(): Result<void, BusinessRuleViolationError> {
    if (this._status !== 'PENDING') {
      return Err(new BusinessRuleViolationError('Order can only be confirmed from pending status'));
    }

    this.changeStatus('CONFIRMED');
    this.calculateEstimatedDeliveryTime();
    return Ok(undefined);
  }

  startPreparation(): Result<void, BusinessRuleViolationError> {
    if (this._status !== 'CONFIRMED') {
      return Err(new BusinessRuleViolationError('Order must be confirmed before preparation can start'));
    }

    if (this._paymentStatus !== 'PAID') {
      return Err(new BusinessRuleViolationError('Order must be paid before preparation can start'));
    }

    this.changeStatus('PREPARING');
    return Ok(undefined);
  }

  markAsReady(): Result<void, BusinessRuleViolationError> {
    if (this._status !== 'PREPARING') {
      return Err(new BusinessRuleViolationError('Order must be in preparation to mark as ready'));
    }

    this.changeStatus('READY');
    return Ok(undefined);
  }

  startDelivery(): Result<void, BusinessRuleViolationError> {
    if (this._status !== 'READY') {
      return Err(new BusinessRuleViolationError('Order must be ready before delivery can start'));
    }

    if (this.deliveryType === 'PICKUP') {
      return Err(new BusinessRuleViolationError('Pickup orders cannot be delivered'));
    }

    this.changeStatus('OUT_FOR_DELIVERY');
    return Ok(undefined);
  }

  markAsDelivered(): Result<void, BusinessRuleViolationError> {
    if (this.deliveryType === 'PICKUP' && this._status !== 'READY') {
      return Err(new BusinessRuleViolationError('Pickup order must be ready to mark as delivered'));
    }

    if (this.deliveryType === 'DELIVERY' && this._status !== 'OUT_FOR_DELIVERY') {
      return Err(new BusinessRuleViolationError('Delivery order must be out for delivery to mark as delivered'));
    }

    this.changeStatus('DELIVERED');
    return Ok(undefined);
  }

  cancel(): Result<void, BusinessRuleViolationError> {
    if (['DELIVERED', 'OUT_FOR_DELIVERY'].includes(this._status)) {
      return Err(new BusinessRuleViolationError('Cannot cancel order that is already delivered or out for delivery'));
    }

    this.changeStatus('CANCELLED');
    return Ok(undefined);
  }

  markPaymentAsPaid(): void {
    this._paymentStatus = 'PAID';
  }

  markPaymentAsFailed(): void {
    this._paymentStatus = 'FAILED';
  }

  private changeStatus(newStatus: OrderStatus): void {
    const previousStatus = this._status;
    this._status = newStatus;

    this.addDomainEvent(
      new OrderStatusChangedEvent(
        crypto.randomUUID(),
        this.id,
        previousStatus,
        newStatus
      )
    );
  }

  private calculateEstimatedDeliveryTime(): void {
    const totalPreparationTime = this.items.reduce((total, item) => {
      // This would normally come from the pizza recipe
      const estimatedPizzaTime = 20; // minutes per pizza
      return total + (estimatedPizzaTime * item.quantity);
    }, 0);

    const deliveryTime = this.deliveryType === 'DELIVERY' ? 30 : 0;
    const bufferTime = 10;

    this._estimatedDeliveryTime = new Date(
      Date.now() + (totalPreparationTime + deliveryTime + bufferTime) * 60000
    );
  }

  private static validateOrderProps(props: OrderProps): Result<void, ValidationError> {
    if (!props.customerInfo.name.trim()) {
      return Err(new ValidationError('Customer name is required'));
    }

    if (!props.customerInfo.phone.trim()) {
      return Err(new ValidationError('Customer phone is required'));
    }

    if (props.items.length === 0) {
      return Err(new ValidationError('Order must contain at least one item'));
    }

    if (props.deliveryType === 'DELIVERY' && !props.deliveryAddress) {
      return Err(new ValidationError('Delivery address is required for delivery orders'));
    }

    for (const item of props.items) {
      if (item.quantity <= 0) {
        return Err(new ValidationError('Item quantity must be positive'));
      }
    }

    return Ok(undefined);
  }

  private static calculateTotalAmount(items: OrderItem[]): Money {
    return items.reduce((total, item) => total.add(item.totalPrice), items[0].totalPrice.multiply(0));
  }

  private static calculateTax(amount: Money): Money {
    const taxRate = 0.1; // 10% tax
    return amount.multiply(taxRate);
  }

  private static calculateDeliveryFee(deliveryType: DeliveryType, address?: Address): Money {
    if (deliveryType === 'PICKUP') {
      return Money.create(0, 'USD');
    }

    // Basic delivery fee logic
    return Money.create(5, 'USD');
  }
}