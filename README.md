# DePizza - Enterprise Pizza Delivery Platform

## 🍕 Overview

DePizza is a sophisticated, enterprise-grade pizza delivery platform built with modern architecture patterns including Domain-Driven Design (DDD), Clean Architecture, and functional programming principles. The application demonstrates advanced TypeScript patterns, monads, and sophisticated domain modeling.

## 🏗️ Architecture

### Domain-Driven Design (DDD)
- **Domain Layer**: Pure business logic with no external dependencies
- **Application Layer**: Use cases and application services  
- **Infrastructure Layer**: Database, external services, and technical concerns
- **Presentation Layer**: UI components and API endpoints

### Key Design Patterns
- **Repository Pattern**: Clean data access abstraction
- **Strategy Pattern**: Flexible pricing strategies
- **Monad Pattern**: Functional error handling with Result<T, E>
- **Value Objects**: Type-safe domain primitives (Money, Email, etc.)
- **Aggregate Roots**: Consistency boundaries with domain events
- **CQRS**: Command Query Responsibility Segregation

### Functional Programming Features
- **Monads**: Maybe, Result, IO, State, Reader monads
- **Immutable Data**: Lens for safe transformations
- **Function Composition**: Pipe and compose utilities
- **Memoization**: Performance optimization
- **Trampoline**: Tail call optimization

## 🚀 Tech Stack

### Core Technologies
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible UI components

### Backend & Database
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database access
- **Zod** - Runtime type validation
- **JWT** - Authentication

### State Management & Data Fetching
- **TanStack Query** - Server state management
- **Zustand** - Client state management

### Functional Programming
- **fp-ts** - Functional programming utilities
- **neverthrow** - Result type for error handling

## 📁 Project Structure

```
src/
├── domain/                  # Pure business logic
│   ├── shared/             # Shared domain primitives
│   │   ├── types.ts        # Base entity types
│   │   ├── result.ts       # Result monad for error handling
│   │   ├── money.ts        # Money value object
│   │   └── functional.ts   # Advanced FP utilities
│   ├── user/               # User domain
│   │   └── user.ts         # User aggregate root
│   ├── menu/               # Menu domain
│   │   └── pizza.ts        # Pizza aggregates
│   └── order/              # Order domain
│       ├── order.ts        # Order aggregate root
│       └── order-pricing-service.ts # Advanced pricing logic
├── application/            # Use cases and services
│   └── use-cases/
│       └── auth/           # Authentication use cases
├── infrastructure/        # External concerns
│   └── database/
│       ├── schema.ts       # Database schema
│       ├── connection.ts   # DB connection
│       └── repositories/   # Data access
├── presentation/          # UI and API
│   ├── components/        # React components
│   └── app/              # Next.js app directory
└── lib/                  # Shared utilities
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### 1. Clone the repository
```bash
git clone <repository-url>
cd depizza
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment setup
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and other configuration.

### 4. Database setup
```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Or push schema directly (development)
npm run db:push

# Seed initial data
npm run db:seed
```

### 5. Start development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎯 Key Features

### Business Features
- **Pizza Menu Management**: Complex ingredient relationships
- **Advanced Pricing**: Dynamic pricing with multiple strategies
- **Order Management**: Complete order lifecycle with state machines
- **User Authentication**: Secure JWT-based auth with roles
- **Real-time Updates**: Order status tracking

### Technical Features
- **Type Safety**: End-to-end TypeScript with strict configuration
- **Error Handling**: Functional error handling with Result types
- **Domain Events**: Event-driven architecture
- **Caching**: Intelligent memoization and query caching
- **Validation**: Comprehensive input validation with Zod
- **Performance**: Optimized with React Query and memoization

## 🧪 Domain Model Examples

### Money Value Object
```typescript
const price = Money.create(18.99, 'USD');
const total = price.multiply(2).add(tax);
```

### Result Monad Error Handling
```typescript
const userResult = await User.create({
  email: 'user@example.com',
  password: 'secure123'
});

if (userResult.isErr()) {
  return userResult.error; // Type-safe error handling
}

const user = userResult.value; // Type-safe success value
```

### Advanced Pricing Strategy
```typescript
const pricingService = new OrderPricingService(
  new SeasonalPricingStrategy()
);

const price = await pricingService.calculateOrderItemPrice(
  pizza, context, ingredients
);
```

## 📊 Database Schema

The database uses advanced PostgreSQL features:
- **UUID Primary Keys**: For security and scalability
- **JSONB Fields**: For flexible document storage
- **Enums**: Type-safe status values
- **Relations**: Proper foreign key constraints
- **Indexes**: Optimized for common queries

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with configurable rounds
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Sanitized outputs
- **CSRF Protection**: Built-in Next.js protection

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables
Ensure all production environment variables are configured:
- Database connection string
- JWT secret (generate a secure random string)
- External service credentials

## 🧑‍💻 Development

### Code Style
- **ESLint**: Configured for TypeScript and React
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict mode enabled

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run db:studio    # Open Drizzle Studio
```

## 🎓 Learning Resources

This project demonstrates advanced patterns:
- Domain-Driven Design
- Clean Architecture
- Functional Programming in TypeScript
- Advanced React patterns
- Database design
- API design

## 📝 License

This project is for educational purposes and demonstrates enterprise-grade architecture patterns.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes following the established patterns
4. Add tests for new functionality
5. Submit a pull request

---

Built with ❤️ and advanced software engineering principles.
