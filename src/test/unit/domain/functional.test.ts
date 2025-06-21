import { describe, it, expect } from 'vitest';
import { Maybe, IO, pipe, compose, curry, memoize } from '@/domain/shared/functional';

describe('Functional Programming Utilities', () => {
  describe('Maybe Monad', () => {
    it('should create Some value', () => {
      const maybe = Maybe.some(42);
      
      expect(maybe.isSome()).toBe(true);
      expect(maybe.isNone()).toBe(false);
      expect(maybe.getOrElse(0)).toBe(42);
    });

    it('should create None value', () => {
      const maybe = Maybe.none<number>();
      
      expect(maybe.isSome()).toBe(false);
      expect(maybe.isNone()).toBe(true);
      expect(maybe.getOrElse(0)).toBe(0);
    });

    it('should create from nullable value', () => {
      const someValue = Maybe.fromNullable(42);
      const noneValue = Maybe.fromNullable(null);
      
      expect(someValue.isSome()).toBe(true);
      expect(noneValue.isNone()).toBe(true);
    });

    it('should map over Some value', () => {
      const maybe = Maybe.some(5);
      const result = maybe.map(x => x * 2);
      
      expect(result.getOrElse(0)).toBe(10);
    });

    it('should map over None value', () => {
      const maybe = Maybe.none<number>();
      const result = maybe.map(x => x * 2);
      
      expect(result.isNone()).toBe(true);
    });

    it('should flatMap over Some value', () => {
      const maybe = Maybe.some(5);
      const result = maybe.flatMap(x => Maybe.some(x * 2));
      
      expect(result.getOrElse(0)).toBe(10);
    });

    it('should flatMap over None value', () => {
      const maybe = Maybe.none<number>();
      const result = maybe.flatMap(x => Maybe.some(x * 2));
      
      expect(result.isNone()).toBe(true);
    });

    it('should filter Some value', () => {
      const maybe = Maybe.some(5);
      const evenResult = maybe.filter(x => x % 2 === 0);
      const oddResult = maybe.filter(x => x % 2 === 1);
      
      expect(evenResult.isNone()).toBe(true);
      expect(oddResult.isSome()).toBe(true);
    });

    it('should filter None value', () => {
      const maybe = Maybe.none<number>();
      const result = maybe.filter(x => x > 0);
      
      expect(result.isNone()).toBe(true);
    });
  });

  describe('IO Monad', () => {
    it('should create IO computation', () => {
      const io = IO.of(42);
      const result = io.run();
      
      expect(result).toBe(42);
    });

    it('should create lazy IO computation', () => {
      let counter = 0;
      const io = IO.lazy(() => ++counter);
      
      expect(counter).toBe(0); // Not executed yet
      
      const result1 = io.run();
      const result2 = io.run();
      
      expect(result1).toBe(1);
      expect(result2).toBe(2); // Executed each time
    });

    it('should map IO computation', () => {
      const io = IO.of(5);
      const mapped = io.map(x => x * 2);
      const result = mapped.run();
      
      expect(result).toBe(10);
    });

    it('should flatMap IO computation', () => {
      const io1 = IO.of(5);
      const io2 = io1.flatMap(x => IO.of(x * 2));
      const result = io2.run();
      
      expect(result).toBe(10);
    });

    it('should chain IO computations', () => {
      const io1 = IO.of(5);
      const io2 = io1.chain(x => IO.of(x.toString()));
      const result = io2.run();
      
      expect(result).toBe('5');
    });
  });

  describe('Function Composition', () => {
    it('should pipe functions', () => {
      const add1 = (x: number) => x + 1;
      const multiply2 = (x: number) => x * 2;
      const toString = (x: number) => x.toString();
      
      const pipeline = pipe(add1, multiply2, toString);
      const result = pipeline(5);
      
      expect(result).toBe('12'); // (5 + 1) * 2 = 12
    });

    it('should compose functions', () => {
      const add1 = (x: number) => x + 1;
      const multiply2 = (x: number) => x * 2;
      
      const composed = compose(multiply2, add1);
      const result = composed(5);
      
      expect(result).toBe(12); // (5 + 1) * 2 = 12
    });

    it('should curry functions', () => {
      const add = (a: number, b: number) => a + b;
      const curriedAdd = curry(add);
      
      const add5 = curriedAdd(5);
      const result = add5(3);
      
      expect(result).toBe(8);
    });
  });

  describe('Memoization', () => {
    it('should memoize function results', () => {
      let callCount = 0;
      const expensiveFunction = (x: number) => {
        callCount++;
        return x * x;
      };
      
      const memoized = memoize(expensiveFunction);
      
      const result1 = memoized(5);
      const result2 = memoized(5);
      const result3 = memoized(3);
      
      expect(result1).toBe(25);
      expect(result2).toBe(25);
      expect(result3).toBe(9);
      expect(callCount).toBe(2); // Only called twice, second call with 5 was cached
    });

    it('should use custom key generator', () => {
      let callCount = 0;
      const func = (obj: { id: number; name: string }) => {
        callCount++;
        return `${obj.id}-${obj.name}`;
      };
      
      const memoized = memoize(func, (obj) => obj.id.toString());
      
      const result1 = memoized({ id: 1, name: 'John' });
      const result2 = memoized({ id: 1, name: 'Jane' }); // Different name but same id
      
      expect(result1).toBe('1-John');
      expect(result2).toBe('1-John'); // Cached result with same id
      expect(callCount).toBe(1);
    });
  });

  describe('Real-world usage examples', () => {
    it('should handle nullable API response with Maybe', () => {
      interface User {
        id: number;
        name: string;
        email?: string;
      }
      
      const user: User = { id: 1, name: 'John' };
      
      const email = Maybe.fromNullable(user.email)
        .map(email => email.toLowerCase())
        .map(email => email.trim())
        .getOrElse('no-email@example.com');
      
      expect(email).toBe('no-email@example.com');
    });

    it('should compose data transformation pipeline', () => {
      interface RawData {
        user_name: string;
        user_age: string;
      }
      
      interface CleanData {
        name: string;
        age: number;
        isAdult: boolean;
      }
      
      const parseAge = (ageStr: string): number => parseInt(ageStr, 10);
      const checkAdult = (age: number): boolean => age >= 18;
      
      const transformUser = (raw: RawData): CleanData => {
        const age = parseAge(raw.user_age);
        return {
          name: raw.user_name.trim(),
          age,
          isAdult: checkAdult(age),
        };
      };
      
      const rawData: RawData = { user_name: '  John Doe  ', user_age: '25' };
      const result = transformUser(rawData);
      
      expect(result).toEqual({
        name: 'John Doe',
        age: 25,
        isAdult: true,
      });
    });

    it('should handle IO side effects', () => {
      let logs: string[] = [];
      
      const log = (message: string): IO<void> => 
        IO.lazy(() => { logs.push(message); });
      
      const calculate = (x: number): IO<number> =>
        IO.of(x * 2);
      
      const program = calculate(5)
        .flatMap(result => log(`Result: ${result}`).map(() => result))
        .flatMap(result => log(`Final: ${result}`).map(() => result));
      
      const result = program.run();
      
      expect(result).toBe(10);
      expect(logs).toEqual(['Result: 10', 'Final: 10']);
    });
  });
});