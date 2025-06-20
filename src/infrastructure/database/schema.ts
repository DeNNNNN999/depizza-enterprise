import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN']);
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'SUSPENDED', 'DELETED']);
export const pizzaSizeEnum = pgEnum('pizza_size', ['SMALL', 'MEDIUM', 'LARGE', 'XLARGE']);
export const pizzaCrustEnum = pgEnum('pizza_crust', ['THIN', 'THICK', 'STUFFED']);
export const ingredientCategoryEnum = pgEnum('ingredient_category', [
  'CHEESE',
  'MEAT',
  'VEGETABLES',
  'SAUCE',
  'SPICES',
]);
export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'PAID', 'FAILED', 'REFUNDED']);
export const deliveryTypeEnum = pgEnum('delivery_type', ['PICKUP', 'DELIVERY']);
export const currencyEnum = pgEnum('currency', ['USD', 'EUR', 'RUB']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  role: userRoleEnum('role').notNull().default('CUSTOMER'),
  status: userStatusEnum('status').notNull().default('ACTIVE'),
  emailVerified: boolean('email_verified').notNull().default(false),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Ingredients table
export const ingredients = pgTable('ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  category: ingredientCategoryEnum('category').notNull(),
  pricePerUnitCents: integer('price_per_unit_cents').notNull(),
  currency: currencyEnum('currency').notNull().default('USD'),
  isAvailable: boolean('is_available').notNull().default(true),
  allergens: json('allergens').$type<string[]>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Pizza recipes table
export const pizzaRecipes = pgTable('pizza_recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  basePriceCents: integer('base_price_cents').notNull(),
  currency: currencyEnum('currency').notNull().default('USD'),
  preparationTimeMinutes: integer('preparation_time_minutes').notNull(),
  difficulty: integer('difficulty').notNull(), // 1-5
  isVegetarian: boolean('is_vegetarian').notNull().default(false),
  isVegan: boolean('is_vegan').notNull().default(false),
  isGlutenFree: boolean('is_gluten_free').notNull().default(false),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Pizza recipe ingredients (many-to-many)
export const pizzaRecipeIngredients = pgTable('pizza_recipe_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().references(() => pizzaRecipes.id),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Orders table
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => users.id),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  status: orderStatusEnum('status').notNull().default('PENDING'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('PENDING'),
  deliveryType: deliveryTypeEnum('delivery_type').notNull(),
  deliveryAddress: json('delivery_address').$type<{
    street: string;
    city: string;
    postalCode: string;
    country: string;
    additionalInfo?: string;
  }>(),
  specialInstructions: text('special_instructions'),
  requestedDeliveryTime: timestamp('requested_delivery_time'),
  estimatedDeliveryTime: timestamp('estimated_delivery_time'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum('currency').notNull().default('USD'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Order items table
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  recipeId: uuid('recipe_id').notNull().references(() => pizzaRecipes.id),
  size: pizzaSizeEnum('size').notNull(),
  crust: pizzaCrustEnum('crust').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum('currency').notNull().default('USD'),
  customIngredients: json('custom_ingredients').$type<Record<string, number>>(),
  specialInstructions: text('special_instructions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Domain events table
export const domainEvents = pgTable('domain_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().unique(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  eventData: json('event_data').notNull(),
  eventVersion: integer('event_version').notNull(),
  occurredOn: timestamp('occurred_on').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  pizzaRecipeIngredients: many(pizzaRecipeIngredients),
}));

export const pizzaRecipesRelations = relations(pizzaRecipes, ({ many }) => ({
  ingredients: many(pizzaRecipeIngredients),
  orderItems: many(orderItems),
}));

export const pizzaRecipeIngredientsRelations = relations(pizzaRecipeIngredients, ({ one }) => ({
  recipe: one(pizzaRecipes, {
    fields: [pizzaRecipeIngredients.recipeId],
    references: [pizzaRecipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [pizzaRecipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  recipe: one(pizzaRecipes, {
    fields: [orderItems.recipeId],
    references: [pizzaRecipes.id],
  }),
}));

// Export types for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;
export type PizzaRecipe = typeof pizzaRecipes.$inferSelect;
export type NewPizzaRecipe = typeof pizzaRecipes.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;