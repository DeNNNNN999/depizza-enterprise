'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Pizza, Clock, Star, Leaf } from "lucide-react";

export default function HomePage() {
  const featuredPizzas = [
    {
      id: '1',
      name: 'Margherita Suprema',
      description: 'Fresh mozzarella, basil, san marzano tomatoes',
      price: '$18.99',
      prepTime: '15 min',
      rating: 4.8,
      isVegetarian: true,
      image: '🍕'
    },
    {
      id: '2',
      name: 'Truffle Deluxe',
      description: 'Black truffle, wild mushrooms, fontina cheese',
      price: '$32.99',
      prepTime: '20 min',
      rating: 4.9,
      isVegetarian: true,
      image: '🍄'
    },
    {
      id: '3',
      name: 'Pepperoni Classic',
      description: 'Premium pepperoni, mozzarella, tomato sauce',
      price: '$22.99',
      prepTime: '12 min',
      rating: 4.7,
      isVegetarian: false,
      image: '🥩'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Pizza className="h-8 w-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">DePizza</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/menu" className="text-gray-600 hover:text-gray-900">Menu</Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-50 to-orange-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Artisan Pizza, <span className="text-red-600">Delivered Fresh</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience premium ingredients, traditional recipes, and innovative flavors 
            crafted by our master pizzaiolos and delivered right to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/menu">
              <Button size="lg" className="text-lg px-8 py-4">
                Order Now
              </Button>
            </Link>
            <Link href="/menu?filter=popular">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                View Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Average delivery time of 25 minutes or less</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fresh Ingredients</h3>
              <p className="text-gray-600">Locally sourced, organic ingredients daily</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">5-Star Quality</h3>
              <p className="text-gray-600">Rated #1 pizza in the city by customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pizzas */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Pizzas</h2>
            <p className="text-lg text-gray-600">Our most popular artisan creations</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredPizzas.map((pizza) => (
              <Card key={pizza.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl text-center mb-4">{pizza.image}</div>
                  <CardTitle className="text-center">{pizza.name}</CardTitle>
                  <CardDescription className="text-center">
                    {pizza.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-red-600">{pizza.price}</span>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">{pizza.prepTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{pizza.rating}</span>
                    </div>
                    {pizza.isVegetarian && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Leaf className="h-3 w-3 mr-1" />
                        Vegetarian
                      </Badge>
                    )}
                  </div>
                  <Button className="w-full">Add to Cart</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of satisfied customers and experience the DePizza difference
          </p>
          <Link href="/menu">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              Browse Full Menu
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Pizza className="h-6 w-6 text-red-500" />
                <span className="text-xl font-bold">DePizza</span>
              </div>
              <p className="text-gray-400">
                Crafting exceptional pizzas with passion and precision since 2020.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/menu" className="hover:text-white">Menu</Link></li>
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Customer Care</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/delivery" className="hover:text-white">Delivery Info</Link></li>
                <li><Link href="/returns" className="hover:text-white">Returns</Link></li>
                <li><Link href="/nutrition" className="hover:text-white">Nutrition</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact Info</h3>
              <div className="space-y-2 text-gray-400">
                <p>📞 (555) 123-PIZZA</p>
                <p>📧 hello@depizza.com</p>
                <p>📍 123 Artisan Street<br />Foodie District, FD 12345</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DePizza. All rights reserved. Built with advanced domain-driven architecture.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
