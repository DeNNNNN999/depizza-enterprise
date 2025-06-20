import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/infrastructure/database/connection';
import { pizzaRecipes, ingredients, pizzaRecipeIngredients } from '@/infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';

const CreatePizzaSchema = z.object({
  name: z.string().min(1, 'Pizza name is required'),
  description: z.string().min(1, 'Description is required'),
  basePrice: z.number().positive('Base price must be positive'),
  currency: z.enum(['USD', 'EUR', 'RUB']).default('USD'),
  preparationTimeMinutes: z.number().int().positive('Preparation time must be positive'),
  difficulty: z.number().int().min(1).max(5, 'Difficulty must be between 1 and 5'),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  ingredients: z.array(z.object({
    ingredientId: z.string().uuid(),
    quantity: z.number().positive(),
  })).min(1, 'Pizza must have at least one ingredient'),
});

// GET /api/menu/pizzas - Get all available pizzas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vegetarianOnly = searchParams.get('vegetarian') === 'true';
    const veganOnly = searchParams.get('vegan') === 'true';
    const glutenFreeOnly = searchParams.get('glutenFree') === 'true';

    let query = db
      .select({
        id: pizzaRecipes.id,
        name: pizzaRecipes.name,
        description: pizzaRecipes.description,
        basePrice: pizzaRecipes.basePrice,
        currency: pizzaRecipes.currency,
        preparationTimeMinutes: pizzaRecipes.preparationTimeMinutes,
        difficulty: pizzaRecipes.difficulty,
        isVegetarian: pizzaRecipes.isVegetarian,
        isVegan: pizzaRecipes.isVegan,
        isGlutenFree: pizzaRecipes.isGlutenFree,
        isAvailable: pizzaRecipes.isAvailable,
      })
      .from(pizzaRecipes)
      .where(eq(pizzaRecipes.isAvailable, true));

    // Apply filters
    const conditions = [];
    if (vegetarianOnly) conditions.push(eq(pizzaRecipes.isVegetarian, true));
    if (veganOnly) conditions.push(eq(pizzaRecipes.isVegan, true));
    if (glutenFreeOnly) conditions.push(eq(pizzaRecipes.isGlutenFree, true));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const pizzas = await query;

    // Get ingredients for each pizza
    const pizzasWithIngredients = await Promise.all(
      pizzas.map(async (pizza) => {
        const pizzaIngredients = await db
          .select({
            ingredientId: pizzaRecipeIngredients.ingredientId,
            quantity: pizzaRecipeIngredients.quantity,
            ingredient: {
              id: ingredients.id,
              name: ingredients.name,
              category: ingredients.category,
              pricePerUnit: ingredients.pricePerUnit,
              currency: ingredients.currency,
              allergens: ingredients.allergens,
            },
          })
          .from(pizzaRecipeIngredients)
          .innerJoin(ingredients, eq(pizzaRecipeIngredients.ingredientId, ingredients.id))
          .where(
            and(
              eq(pizzaRecipeIngredients.recipeId, pizza.id),
              eq(ingredients.isAvailable, true)
            )
          );

        return {
          ...pizza,
          ingredients: pizzaIngredients,
        };
      })
    );

    return NextResponse.json({
      pizzas: pizzasWithIngredients,
      total: pizzasWithIngredients.length,
    });
  } catch (error) {
    console.error('Error fetching pizzas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pizzas' },
      { status: 500 }
    );
  }
}

// POST /api/menu/pizzas - Create new pizza (Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreatePizzaSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify all ingredients exist and are available
    const ingredientIds = data.ingredients.map(i => i.ingredientId);
    const existingIngredients = await db
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(
        and(
          eq(ingredients.isAvailable, true),
          // Add proper SQL IN condition here
        )
      );

    if (existingIngredients.length !== ingredientIds.length) {
      return NextResponse.json(
        { error: 'Some ingredients are not available or do not exist' },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create pizza recipe
      const [newPizza] = await tx
        .insert(pizzaRecipes)
        .values({
          name: data.name,
          description: data.description,
          basePrice: data.basePrice.toString(),
          currency: data.currency,
          preparationTimeMinutes: data.preparationTimeMinutes,
          difficulty: data.difficulty,
          isVegetarian: data.isVegetarian,
          isVegan: data.isVegan,
          isGlutenFree: data.isGlutenFree,
        })
        .returning();

      // Add ingredients to pizza
      const pizzaIngredientEntries = data.ingredients.map(ingredient => ({
        recipeId: newPizza.id,
        ingredientId: ingredient.ingredientId,
        quantity: ingredient.quantity.toString(),
      }));

      await tx
        .insert(pizzaRecipeIngredients)
        .values(pizzaIngredientEntries);

      return newPizza;
    });

    return NextResponse.json(
      {
        message: 'Pizza created successfully',
        pizza: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating pizza:', error);
    return NextResponse.json(
      { error: 'Failed to create pizza' },
      { status: 500 }
    );
  }
}