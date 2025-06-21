import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Star, Clock, Leaf, ShoppingCart } from 'lucide-react';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible card component for displaying content in a contained, elevated surface. Perfect for pizza listings, user profiles, and feature highlights.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Card
export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Margherita Pizza</CardTitle>
        <CardDescription>
          Fresh mozzarella, basil, and san marzano tomatoes on a thin crust
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-red-600">$18.99</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Add to Cart</Button>
      </CardFooter>
    </Card>
  ),
};

// Pizza Card Example
export const PizzaCard: Story = {
  render: () => (
    <Card className="w-80 hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="text-4xl text-center mb-4">🍕</div>
        <CardTitle className="text-center">Truffle Deluxe</CardTitle>
        <CardDescription className="text-center">
          Black truffle, wild mushrooms, fontina cheese, and arugula
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-red-600">$32.99</span>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">20 min</span>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">4.9</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Leaf className="h-3 w-3 mr-1" />
            Vegetarian
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  ),
};

// User Profile Card
export const UserProfile: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            JD
          </div>
          <div>
            <CardTitle>John Doe</CardTitle>
            <CardDescription>Pizza Enthusiast</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Orders:</span>
            <span className="font-medium">47</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Member since:</span>
            <span className="font-medium">Jan 2024</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Favorite:</span>
            <span className="font-medium">Margherita</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          View Profile
        </Button>
      </CardFooter>
    </Card>
  ),
};

// Order Status Card
export const OrderStatus: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Order #12345</CardTitle>
          <Badge>Preparing</Badge>
        </div>
        <CardDescription>Placed 15 minutes ago</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>2x Margherita Pizza</span>
            <span>$37.98</span>
          </div>
          <div className="flex justify-between">
            <span>1x Pepperoni Pizza</span>
            <span>$22.99</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>$60.97</span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>60%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Track Order
        </Button>
      </CardFooter>
    </Card>
  ),
};

// Feature Card
export const FeatureCard: Story = {
  render: () => (
    <Card className="w-80 text-center">
      <CardHeader>
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-red-600" />
        </div>
        <CardTitle>Fast Delivery</CardTitle>
        <CardDescription>
          Average delivery time of 25 minutes or less
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Our efficient delivery network ensures your pizza arrives hot and fresh, 
          right when you need it most.
        </p>
      </CardContent>
    </Card>
  ),
};

// Statistics Card
export const StatisticsCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Today's Statistics</CardTitle>
        <CardDescription>Live metrics from our kitchen</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">127</div>
            <div className="text-sm text-gray-600">Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">18min</div>
            <div className="text-sm text-gray-600">Avg Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">98%</div>
            <div className="text-sm text-gray-600">Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">$2.4k</div>
            <div className="text-sm text-gray-600">Revenue</div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

// Interactive Card
export const InteractiveCard: Story = {
  render: () => (
    <Card className="w-80 cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105">
      <CardHeader>
        <CardTitle>Special Offer</CardTitle>
        <CardDescription>Limited time promotion</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">50% OFF</div>
          <p className="text-sm text-gray-600">
            On your second pizza when you order two or more
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="destructive">
          Claim Offer
        </Button>
      </CardFooter>
    </Card>
  ),
};

// Card Grid Example
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Margherita</CardTitle>
          <CardDescription>Classic Italian</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold">$18.99</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Pepperoni</CardTitle>
          <CardDescription>All-time favorite</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold">$22.99</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Hawaiian</CardTitle>
          <CardDescription>Tropical delight</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold">$24.99</p>
        </CardContent>
      </Card>
    </div>
  ),
};

// Loading State Card
export const LoadingCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="animate-pulse w-full">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </CardFooter>
    </Card>
  ),
};