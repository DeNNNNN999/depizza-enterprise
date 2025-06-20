import { z } from 'zod';
import { BaseAggregateRoot, ID } from '../shared/types';
import { Money, CurrencySchema } from '../shared/money';
import { ValidationError, Result, Ok, Err } from '../shared/result';

export const PizzaSizeSchema = z.enum(['SMALL', 'MEDIUM', 'LARGE', 'XLARGE']);
export type PizzaSize = z.infer<typeof PizzaSizeSchema>;

export const PizzaCrustSchema = z.enum(['THIN', 'THICK', 'STUFFED']);
export type PizzaCrust = z.infer<typeof PizzaCrustSchema>;

export const IngredientCategorySchema = z.enum([
  'CHEESE',
  'MEAT',
  'VEGETABLES',
  'SAUCE',
  'SPICES',
]);
export type IngredientCategory = z.infer<typeof IngredientCategorySchema>;

export interface IngredientProps {
  id: ID;
  name: string;
  category: IngredientCategory;
  pricePerUnit: Money;
  isAvailable: boolean;
  allergens?: string[];
}

export class Ingredient extends BaseAggregateRoot {
  private constructor(
    id: ID,
    public readonly name: string,
    public readonly category: IngredientCategory,
    public readonly pricePerUnit: Money,
    private _isAvailable: boolean,
    public readonly allergens: string[] = []
  ) {
    super(id);
  }

  static create(props: IngredientProps): Result<Ingredient, ValidationError> {
    if (!props.name.trim()) {
      return Err(new ValidationError('Ingredient name cannot be empty'));
    }

    return Ok(
      new Ingredient(
        props.id,
        props.name.trim(),
        props.category,
        props.pricePerUnit,
        props.isAvailable,
        props.allergens || []
      )
    );
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  markAsUnavailable(): void {
    this._isAvailable = false;
  }

  markAsAvailable(): void {
    this._isAvailable = true;
  }
}

export interface PizzaRecipeProps {
  id: ID;
  name: string;
  description: string;
  ingredients: Map<ID, number>; // ingredientId -> quantity
  basePrice: Money;
  preparationTimeMinutes: number;
  difficulty: number; // 1-5
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
}

export class PizzaRecipe extends BaseAggregateRoot {
  private constructor(
    id: ID,
    public readonly name: string,
    public readonly description: string,
    public readonly ingredients: Map<ID, number>,
    public readonly basePrice: Money,
    public readonly preparationTimeMinutes: number,
    public readonly difficulty: number,
    public readonly isVegetarian: boolean,
    public readonly isVegan: boolean,
    public readonly isGlutenFree: boolean
  ) {
    super(id);
  }

  static create(props: PizzaRecipeProps): Result<PizzaRecipe, ValidationError> {
    if (!props.name.trim()) {
      return Err(new ValidationError('Pizza name cannot be empty'));
    }

    if (props.preparationTimeMinutes <= 0) {
      return Err(new ValidationError('Preparation time must be positive'));
    }

    if (props.difficulty < 1 || props.difficulty > 5) {
      return Err(new ValidationError('Difficulty must be between 1 and 5'));
    }

    if (props.ingredients.size === 0) {
      return Err(new ValidationError('Pizza must have at least one ingredient'));
    }

    return Ok(
      new PizzaRecipe(
        props.id,
        props.name.trim(),
        props.description.trim(),
        props.ingredients,
        props.basePrice,
        props.preparationTimeMinutes,
        props.difficulty,
        props.isVegetarian || false,
        props.isVegan || false,
        props.isGlutenFree || false
      )
    );
  }

  calculateTotalPrice(ingredientPrices: Map<ID, Money>, size: PizzaSize): Money {
    const sizeMultiplier = this.getSizeMultiplier(size);
    let totalPrice = this.basePrice.multiply(sizeMultiplier);

    for (const [ingredientId, quantity] of this.ingredients.entries()) {
      const ingredientPrice = ingredientPrices.get(ingredientId);
      if (ingredientPrice) {
        totalPrice = totalPrice.add(ingredientPrice.multiply(quantity * sizeMultiplier));
      }
    }

    return totalPrice;
  }

  private getSizeMultiplier(size: PizzaSize): number {
    const multipliers = {
      SMALL: 0.8,
      MEDIUM: 1.0,
      LARGE: 1.3,
      XLARGE: 1.6,
    };
    return multipliers[size];
  }

  getEstimatedPreparationTime(size: PizzaSize): number {
    const sizeTimeMultiplier = this.getSizeMultiplier(size);
    const difficultyMultiplier = 1 + (this.difficulty - 1) * 0.2;
    return Math.ceil(this.preparationTimeMinutes * sizeTimeMultiplier * difficultyMultiplier);
  }
}

export interface PizzaProps {
  recipeId: ID;
  size: PizzaSize;
  crust: PizzaCrust;
  customIngredients?: Map<ID, number>;
  specialInstructions?: string;
}

export class Pizza {
  constructor(
    public readonly recipeId: ID,
    public readonly size: PizzaSize,
    public readonly crust: PizzaCrust,
    public readonly customIngredients: Map<ID, number> = new Map(),
    public readonly specialInstructions?: string
  ) {}

  static create(props: PizzaProps): Result<Pizza, ValidationError> {
    if (props.specialInstructions && props.specialInstructions.length > 500) {
      return Err(new ValidationError('Special instructions too long (max 500 characters)'));
    }

    return Ok(
      new Pizza(
        props.recipeId,
        props.size,
        props.crust,
        props.customIngredients,
        props.specialInstructions
      )
    );
  }

  hasCustomIngredients(): boolean {
    return this.customIngredients.size > 0;
  }
}