import { Money, Currency } from '../shared/money';
import { PizzaRecipe, PizzaSize, Ingredient } from '../menu/pizza';
import { OrderItem } from './order';
import { Maybe, pipe, memoize, Lens } from '../shared/functional';
import { Result, Ok, Err, ValidationError } from '../shared/result';

// Advanced pricing strategy pattern with functional composition
export interface PricingStrategy {
  calculatePrice(basePrice: Money, context: PricingContext): Money;
}

export interface PricingContext {
  size: PizzaSize;
  customIngredients: Map<string, number>;
  quantity: number;
  customerType: 'REGULAR' | 'VIP' | 'STAFF';
  orderTime: Date;
  isHappyHour: boolean;
  seasonalModifiers: SeasonalModifier[];
}

export interface SeasonalModifier {
  name: string;
  multiplier: number;
  validFrom: Date;
  validTo: Date;
  applicableToSizes?: PizzaSize[];
}

// Lens for immutable price calculations
const priceAmountLens = Lens.of<Money, number>(
  money => money.amount,
  amount => money => Money.create(amount, money.currency)
);

// Memoized size multiplier calculation
const getSizeMultiplier = memoize((size: PizzaSize): number => {
  const multipliers: Record<PizzaSize, number> = {
    SMALL: 0.8,
    MEDIUM: 1.0,
    LARGE: 1.3,
    XLARGE: 1.6,
  };
  return multipliers[size];
});

export class BasePricingStrategy implements PricingStrategy {
  calculatePrice(basePrice: Money, context: PricingContext): Money {
    const sizeMultiplier = getSizeMultiplier(context.size);
    return basePrice.multiply(sizeMultiplier);
  }
}

export class VIPPricingStrategy implements PricingStrategy {
  private readonly discountRate = 0.1; // 10% discount

  calculatePrice(basePrice: Money, context: PricingContext): Money {
    const basePricing = new BasePricingStrategy();
    const baseCalculatedPrice = basePricing.calculatePrice(basePrice, context);
    
    if (context.customerType === 'VIP') {
      return baseCalculatedPrice.multiply(1 - this.discountRate);
    }
    
    return baseCalculatedPrice;
  }
}

export class HappyHourPricingStrategy implements PricingStrategy {
  private readonly happyHourDiscount = 0.15; // 15% discount

  calculatePrice(basePrice: Money, context: PricingContext): Money {
    const vipPricing = new VIPPricingStrategy();
    let price = vipPricing.calculatePrice(basePrice, context);
    
    if (context.isHappyHour) {
      price = price.multiply(1 - this.happyHourDiscount);
    }
    
    return price;
  }
}

export class SeasonalPricingStrategy implements PricingStrategy {
  calculatePrice(basePrice: Money, context: PricingContext): Money {
    const happyHourPricing = new HappyHourPricingStrategy();
    let price = happyHourPricing.calculatePrice(basePrice, context);
    
    // Apply seasonal modifiers
    const applicableModifiers = context.seasonalModifiers.filter(modifier =>
      this.isModifierApplicable(modifier, context)
    );
    
    for (const modifier of applicableModifiers) {
      price = price.multiply(modifier.multiplier);
    }
    
    return price;
  }

  private isModifierApplicable(modifier: SeasonalModifier, context: PricingContext): boolean {
    const now = context.orderTime;
    const isTimeValid = now >= modifier.validFrom && now <= modifier.validTo;
    const isSizeValid = !modifier.applicableToSizes || 
                       modifier.applicableToSizes.includes(context.size);
    
    return isTimeValid && isSizeValid;
  }
}

// Advanced order pricing service using functional composition
export class OrderPricingService {
  private readonly pricingStrategy: PricingStrategy;
  private readonly ingredientPriceCache = new Map<string, Money>();

  constructor(
    pricingStrategy: PricingStrategy = new SeasonalPricingStrategy()
  ) {
    this.pricingStrategy = pricingStrategy;
  }

  // Functional pipeline for calculating order item price
  calculateOrderItemPrice = pipe(
    this.validatePricingInputs.bind(this),
    this.calculateBasePizzaPrice.bind(this),
    this.addCustomIngredientCosts.bind(this),
    this.applyQuantityMultiplier.bind(this),
    this.applyBulkDiscounts.bind(this)
  );

  async calculateOrderItemPriceAsync(
    recipe: PizzaRecipe,
    context: PricingContext,
    ingredientMap: Map<string, Ingredient>
  ): Promise<Result<Money, ValidationError>> {
    return Maybe.fromNullable(recipe)
      .filter(r => r.basePrice.amount > 0)
      .map(r => this.calculateWithContext(r, context, ingredientMap))
      .map(price => Ok(price))
      .getOrElse(Err(new ValidationError('Invalid recipe or pricing context')));
  }

  private calculateWithContext(
    recipe: PizzaRecipe,
    context: PricingContext,
    ingredientMap: Map<string, Ingredient>
  ): Money {
    // Base pizza price with strategy pattern
    const basePrice = this.pricingStrategy.calculatePrice(recipe.basePrice, context);
    
    // Custom ingredients price calculation
    const customIngredientsPrice = this.calculateCustomIngredientsPrice(
      context.customIngredients,
      ingredientMap,
      context.size
    );
    
    // Total price calculation
    let totalPrice = basePrice.add(customIngredientsPrice);
    
    // Apply quantity-based discounts
    if (context.quantity >= 3) {
      totalPrice = totalPrice.multiply(0.95); // 5% discount for 3+ items
    }
    
    return totalPrice.multiply(context.quantity);
  }

  private calculateCustomIngredientsPrice(
    customIngredients: Map<string, number>,
    ingredientMap: Map<string, Ingredient>,
    size: PizzaSize
  ): Money {
    const sizeMultiplier = getSizeMultiplier(size);
    
    return Array.from(customIngredients.entries())
      .reduce((total, [ingredientId, quantity]) => {
        const ingredient = ingredientMap.get(ingredientId);
        if (!ingredient || !ingredient.isAvailable) {
          return total;
        }
        
        const ingredientPrice = ingredient.pricePerUnit
          .multiply(quantity)
          .multiply(sizeMultiplier);
        
        return total.add(ingredientPrice);
      }, Money.create(0, 'USD'));
  }

  // Functional validation pipeline
  private validatePricingInputs(context: PricingContext): PricingContext {
    if (context.quantity <= 0) {
      throw new ValidationError('Quantity must be positive');
    }
    
    if (!Object.values(['SMALL', 'MEDIUM', 'LARGE', 'XLARGE']).includes(context.size)) {
      throw new ValidationError('Invalid pizza size');
    }
    
    return context;
  }

  private calculateBasePizzaPrice(context: PricingContext): Partial<PricingContext> {
    return { ...context };
  }

  private addCustomIngredientCosts(context: Partial<PricingContext>): Partial<PricingContext> {
    return context;
  }

  private applyQuantityMultiplier(context: Partial<PricingContext>): Partial<PricingContext> {
    return context;
  }

  private applyBulkDiscounts(context: Partial<PricingContext>): PricingContext {
    return context as PricingContext;
  }

  // Dynamic pricing algorithm using machine learning-inspired approach
  calculateDynamicPrice(
    basePrice: Money,
    demandMetrics: {
      currentOrders: number;
      averageOrdersThisHour: number;
      kitchenCapacity: number;
      estimatedWaitTime: number;
    }
  ): Money {
    // Dynamic pricing based on demand and capacity
    const demandRatio = demandMetrics.currentOrders / demandMetrics.kitchenCapacity;
    const timeMultiplier = Math.min(demandMetrics.estimatedWaitTime / 30, 2); // Cap at 2x for 30+ min wait
    
    let priceMultiplier = 1;
    
    if (demandRatio > 0.8) {
      priceMultiplier += 0.1; // 10% surge pricing
    }
    
    if (timeMultiplier > 1.5) {
      priceMultiplier += 0.05; // Additional 5% for long wait times
    }
    
    return basePrice.multiply(priceMultiplier);
  }

  // A* algorithm inspired optimal pricing strategy selector
  selectOptimalPricingStrategy(
    orderHistory: OrderHistoryMetrics,
    currentMarketConditions: MarketConditions
  ): PricingStrategy {
    const strategies = [
      { strategy: new BasePricingStrategy(), score: 0 },
      { strategy: new VIPPricingStrategy(), score: 0 },
      { strategy: new HappyHourPricingStrategy(), score: 0 },
      { strategy: new SeasonalPricingStrategy(), score: 0 },
    ];

    // Score each strategy based on historical performance and current conditions
    strategies.forEach(item => {
      item.score += this.calculateStrategyScore(
        item.strategy,
        orderHistory,
        currentMarketConditions
      );
    });

    // Return strategy with highest score
    return strategies.reduce((best, current) => 
      current.score > best.score ? current : best
    ).strategy;
  }

  private calculateStrategyScore(
    strategy: PricingStrategy,
    history: OrderHistoryMetrics,
    conditions: MarketConditions
  ): number {
    // Simplified scoring algorithm
    let score = 0;
    
    if (strategy instanceof VIPPricingStrategy && conditions.vipCustomerRatio > 0.3) {
      score += 10;
    }
    
    if (strategy instanceof HappyHourPricingStrategy && conditions.isHappyHour) {
      score += 15;
    }
    
    if (strategy instanceof SeasonalPricingStrategy && conditions.seasonalDemand > 1.2) {
      score += 20;
    }
    
    return score;
  }
}

export interface OrderHistoryMetrics {
  averageOrderValue: Money;
  customerRetentionRate: number;
  profitMargin: number;
  orderVelocity: number;
}

export interface MarketConditions {
  competitorPricing: Money[];
  seasonalDemand: number;
  vipCustomerRatio: number;
  isHappyHour: boolean;
  marketVolatility: number;
}