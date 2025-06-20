// Functional Programming Utilities with Monads and Advanced Patterns

export interface Functor<T> {
  map<U>(fn: (value: T) => U): Functor<U>;
}

export interface Monad<T> extends Functor<T> {
  flatMap<U>(fn: (value: T) => Monad<U>): Monad<U>;
  chain<U>(fn: (value: T) => Monad<U>): Monad<U>; // Alias for flatMap
}

export interface Applicative<T> extends Functor<T> {
  apply<U>(fn: Applicative<(value: T) => U>): Applicative<U>;
}

// Maybe Monad for handling null/undefined values
export abstract class Maybe<T> implements Monad<T> {
  abstract map<U>(fn: (value: T) => U): Maybe<U>;
  abstract flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U>;
  abstract chain<U>(fn: (value: T) => Maybe<U>): Maybe<U>;
  abstract isSome(): boolean;
  abstract isNone(): boolean;
  abstract getOrElse(defaultValue: T): T;
  abstract filter(predicate: (value: T) => boolean): Maybe<T>;

  static some<T>(value: T): Maybe<T> {
    return new Some(value);
  }

  static none<T>(): Maybe<T> {
    return new None<T>();
  }

  static fromNullable<T>(value: T | null | undefined): Maybe<T> {
    return value != null ? Maybe.some(value) : Maybe.none<T>();
  }
}

class Some<T> extends Maybe<T> {
  constructor(private value: T) {
    super();
  }

  map<U>(fn: (value: T) => U): Maybe<U> {
    return Maybe.some(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
    return fn(this.value);
  }

  chain<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
    return this.flatMap(fn);
  }

  isSome(): boolean {
    return true;
  }

  isNone(): boolean {
    return false;
  }

  getOrElse(_defaultValue: T): T {
    return this.value;
  }

  filter(predicate: (value: T) => boolean): Maybe<T> {
    return predicate(this.value) ? this : Maybe.none<T>();
  }
}

class None<T> extends Maybe<T> {
  map<U>(_fn: (value: T) => U): Maybe<U> {
    return Maybe.none<U>();
  }

  flatMap<U>(_fn: (value: T) => Maybe<U>): Maybe<U> {
    return Maybe.none<U>();
  }

  chain<U>(_fn: (value: T) => Maybe<U>): Maybe<U> {
    return Maybe.none<U>();
  }

  isSome(): boolean {
    return false;
  }

  isNone(): boolean {
    return true;
  }

  getOrElse(defaultValue: T): T {
    return defaultValue;
  }

  filter(_predicate: (value: T) => boolean): Maybe<T> {
    return this;
  }
}

// IO Monad for handling side effects
export class IO<T> implements Monad<T> {
  constructor(private effect: () => T) {}

  map<U>(fn: (value: T) => U): IO<U> {
    return new IO(() => fn(this.effect()));
  }

  flatMap<U>(fn: (value: T) => IO<U>): IO<U> {
    return new IO(() => fn(this.effect()).run());
  }

  chain<U>(fn: (value: T) => IO<U>): IO<U> {
    return this.flatMap(fn);
  }

  run(): T {
    return this.effect();
  }

  static of<T>(value: T): IO<T> {
    return new IO(() => value);
  }

  static lazy<T>(computation: () => T): IO<T> {
    return new IO(computation);
  }
}

// State Monad for managing state transformations
export class State<S, A> {
  constructor(private runState: (state: S) => [A, S]) {}

  static of<S, A>(value: A): State<S, A> {
    return new State(state => [value, state]);
  }

  map<B>(fn: (value: A) => B): State<S, B> {
    return new State(state => {
      const [value, newState] = this.runState(state);
      return [fn(value), newState];
    });
  }

  flatMap<B>(fn: (value: A) => State<S, B>): State<S, B> {
    return new State(state => {
      const [value, newState] = this.runState(state);
      return fn(value).run(newState);
    });
  }

  run(initialState: S): [A, S] {
    return this.runState(initialState);
  }

  evalState(initialState: S): A {
    return this.run(initialState)[0];
  }

  execState(initialState: S): S {
    return this.run(initialState)[1];
  }
}

// Reader Monad for dependency injection
export class Reader<R, A> {
  constructor(private computation: (env: R) => A) {}

  static of<R, A>(value: A): Reader<R, A> {
    return new Reader(() => value);
  }

  static ask<R>(): Reader<R, R> {
    return new Reader(env => env);
  }

  map<B>(fn: (value: A) => B): Reader<R, B> {
    return new Reader(env => fn(this.computation(env)));
  }

  flatMap<B>(fn: (value: A) => Reader<R, B>): Reader<R, B> {
    return new Reader(env => {
      const value = this.computation(env);
      return fn(value).run(env);
    });
  }

  run(environment: R): A {
    return this.computation(environment);
  }

  local<R2>(fn: (env: R2) => R): Reader<R2, A> {
    return new Reader(env => this.computation(fn(env)));
  }
}

// Utility functions for functional composition
export const pipe = <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
  fns.reduce((acc, fn) => fn(acc), value);

export const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => (a: A): C =>
  f(g(a));

export const curry = <A, B, C>(fn: (a: A, b: B) => C) => (a: A) => (b: B) => C =>
  fn(a, b);

export const partial = <A, B, C>(fn: (a: A, b: B) => C, a: A) => (b: B): C =>
  fn(a, b);

// Lens for immutable data manipulation
export class Lens<S, A> {
  constructor(
    private getter: (s: S) => A,
    private setter: (a: A) => (s: S) => S
  ) {}

  static of<S, A>(getter: (s: S) => A, setter: (a: A) => (s: S) => S): Lens<S, A> {
    return new Lens(getter, setter);
  }

  get(s: S): A {
    return this.getter(s);
  }

  set(a: A): (s: S) => S {
    return this.setter(a);
  }

  modify(fn: (a: A) => A): (s: S) => S {
    return s => this.set(fn(this.get(s)))(s);
  }

  compose<B>(other: Lens<A, B>): Lens<S, B> {
    return new Lens(
      s => other.get(this.get(s)),
      b => s => this.modify(other.set(b))(s)
    );
  }
}

// Memoization for performance optimization
export const memoize = <Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  getKey?: (...args: Args) => string
): ((...args: Args) => Return) => {
  const cache = new Map<string, Return>();
  
  return (...args: Args): Return => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Trampoline for tail call optimization
export type Trampoline<T> = T | (() => Trampoline<T>);

export const trampoline = <T>(computation: Trampoline<T>): T => {
  let result = computation;
  while (typeof result === 'function') {
    result = result();
  }
  return result;
};

// Free Monad for composable interpreters
export abstract class Free<F, A> {
  abstract map<B>(fn: (a: A) => B): Free<F, B>;
  abstract flatMap<B>(fn: (a: A) => Free<F, B>): Free<F, B>;
}

export class Pure<F, A> extends Free<F, A> {
  constructor(public value: A) {
    super();
  }

  map<B>(fn: (a: A) => B): Free<F, B> {
    return new Pure(fn(this.value));
  }

  flatMap<B>(fn: (a: A) => Free<F, B>): Free<F, B> {
    return fn(this.value);
  }
}

export class Impure<F, A> extends Free<F, A> {
  constructor(public operation: F, public continuation: (result: any) => Free<F, A>) {
    super();
  }

  map<B>(fn: (a: A) => B): Free<F, B> {
    return new Impure(this.operation, result => this.continuation(result).map(fn));
  }

  flatMap<B>(fn: (a: A) => Free<F, B>): Free<F, B> {
    return new Impure(this.operation, result => this.continuation(result).flatMap(fn));
  }
}