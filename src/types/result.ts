import type { Iter, Iterable } from "../iterator/index.js";
import { into_iter } from "../iterator/into_iter.js";
import { Option } from "./option.js";

type Cond<K, O, E, U = O | E> = K extends "Ok" ? (K extends "Err" ? U : O) : E;

type OE = "Ok" | "Err";

export type Result<T, E, K extends OE = OE> = K extends "Ok"
    ? ResultI<T, E, "Ok">
    : never & K extends "Err"
      ? ResultI<T, E, "Err">
      : never;

interface ResultI<T, E, K extends "Ok" | "Err" = "Ok" | "Err">
    extends Iterable<T> {
    unwrap(): Cond<K, T, never>;
    unwrap_or(d: T): T;
    unwrap_or_else(f: () => T): T;
    unwrap_err(): Cond<K, never, E>;
    is_ok(): this is Result<T, E, "Ok">;
    is_ok_and(f: (arg0: T) => boolean): boolean;
    is_err(): this is Result<T, E, "Err">;
    is_err_and(f: (arg0: E) => boolean): boolean;
    map<U>(f: (arg0: T) => U): Result<U, E, K>;
    map_err<F>(f: (arg0: E) => F): Result<T, F, K>;
    and<U, L extends OE = OE>(
        rb: Result<U, E, L>,
    ): Result<U, E, Cond<K, L, "Err">>;
    and_then<U, L extends OE = OE>(
        f: (arg0: T) => Result<U, E, L>,
    ): Result<U, E, Cond<K, L, "Err">>;
    or<F, L extends OE = OE>(
        rb: Result<T, F, L>,
    ): Result<T, F, Cond<K, "Ok", L>>;
    or_else<F, L extends OE = OE>(
        f: (arg0: E) => Result<T, F, L>,
    ): Result<T, F, Cond<K, "Ok", L>>;
    ok(): Option<T, Cond<K, "Some", "None">>;
    err(): Option<E, Cond<K, "None", "Some">>;
}

type ResultT = {
    Ok<T, E, K extends OE = OE>(v: T): Result<T, E, K>;
    Err<T, E, K extends OE = OE>(e: E): Result<T, E, K>;
    try<T, E = unknown>(f: () => T): Result<T, E>;
    try_async<T, E = unknown>(f: () => Promise<T>): Promise<Result<T, E>>;
    try_promise<T, E = unknown>(p: Promise<T>): Promise<Result<T, E>>;
    all<T, E>(arr: Result<T, E>[]): Result<T[], E>;
    any<T, E>(arr: Result<T, E>[]): Result<T, E[]>;
};

export const Result: ResultT = {
    Ok: <T, E>(v: T) => new ResultO<T, E>(v) as never,
    Err: <T, E>(e: E) => new ResultE<T, E>(e) as never,
    try: <T, E = unknown>(f: () => T) => {
        try {
            const v = f();
            return Ok(v);
        } catch (e) {
            return Err(e as E);
        }
    },
    try_async: async <T, E = unknown>(f: () => Promise<T>) => {
        try {
            const v = await f();
            return Ok(v);
        } catch (e) {
            return Err(e as E);
        }
    },
    try_promise: async <T, E = unknown>(p: Promise<T>) => {
        try {
            const v = await p;
            return Ok(v);
        } catch (e) {
            return Err(e as E);
        }
    },
    all: <T, E>(arr: Result<T, E>[]) => {
        const res = [];
        for (const o of arr) {
            if (o.is_ok()) {
                res.push(o.unwrap());
            } else {
                return o as Result<T[], E>;
            }
        }
        return Result.Ok(res);
    },
    any: <T, E>(arr: Result<T, E>[]) => {
        const err = [];
        for (const o of arr) {
            if (o.is_ok()) {
                return o as Result<T, E[]>;
            } else {
                err.push(o.unwrap_err());
            }
        }
        return Result.Err(err);
    },
};

export const Ok = <T, E>(v: T) => Result.Ok<T, E>(v);
export const Err = <T, E>(v: E) => Result.Err<T, E>(v);

class ResultE<T, E> implements ResultI<T, E, "Err"> {
    private v: E;
    public constructor(v: E) {
        this.v = v;
    }
    public unwrap(): never {
        throw new Error(`unwrap: ${this.v as E}`);
    }
    public unwrap_or(d: T): T {
        return d;
    }
    public unwrap_or_else(f: () => T): T {
        return f();
    }
    public unwrap_err(): E {
        return this.v;
    }
    public is_ok(): this is Result<T, E, "Ok"> {
        return false;
    }
    public is_ok_and(): boolean {
        return false;
    }
    public is_err(): this is Result<T, E, "Err"> {
        return true;
    }
    public is_err_and(f: (arg0: E) => boolean): boolean {
        return f(this.v);
    }
    public map<U>(): Result<U, E, "Err"> {
        return Result.Err<U, E, "Err">(this.v);
    }
    public map_err<F>(f: (arg0: E) => F): Result<T, F, "Err"> {
        return Result.Err<T, F, "Err">(f(this.unwrap_err()));
    }
    public and<U>(): Result<U, E, "Err"> {
        return Result.Err<U, E, "Err">(this.v);
    }
    public and_then<U>(): Result<U, E, "Err"> {
        return Result.Err<U, E, "Err">(this.v);
    }
    public or<F, L extends OE = OE>(rb: Result<T, F, L>): Result<T, F, L> {
        return rb;
    }
    public or_else<F, L extends OE = OE>(
        f: (arg0: E) => Result<T, F, L>,
    ): Result<T, F, L> {
        return f(this.v);
    }
    public ok(): Option<T, "None"> {
        return Option.None<T, "None">();
    }
    public err(): Option<E, "Some"> {
        return Option.Some<E, "Some">(this.v);
    }
    public iter(): Iter<T> {
        return into_iter([]);
    }
}

class ResultO<T, E> implements ResultI<T, E, "Ok"> {
    private v: T;
    public constructor(v: T) {
        this.v = v;
    }
    public unwrap(): T {
        return this.v;
    }
    public unwrap_or(): T {
        return this.v;
    }
    public unwrap_or_else(): T {
        return this.v;
    }
    public unwrap_err(): never {
        throw new Error(`unwrap_err: ${this.v}`);
    }
    public is_ok(): this is Result<T, E, "Ok"> {
        return true;
    }
    public is_ok_and(f: (arg0: T) => boolean): boolean {
        return f(this.v);
    }
    public is_err(): this is Result<T, E, "Err"> {
        return false;
    }
    public is_err_and(): boolean {
        return false;
    }
    public map<U>(f: (arg0: T) => U): Result<U, E, "Ok"> {
        return Result.Ok<U, E, "Ok">(f(this.unwrap()));
    }
    public map_err<F>(): Result<T, F, "Ok"> {
        return this as unknown as Result<T, F, "Ok">;
    }
    public and<U, L extends OE = OE>(rb: Result<U, E, L>): Result<U, E, L> {
        return rb;
    }
    public and_then<U, L extends OE = OE>(
        f: (arg0: T) => Result<U, E, L>,
    ): Result<U, E, L> {
        return f(this.v);
    }
    public or<F>(): Result<T, F, "Ok"> {
        return Result.Ok<T, F, "Ok">(this.v);
    }
    public or_else<F>(): Result<T, F, "Ok"> {
        return Result.Ok<T, F, "Ok">(this.v);
    }
    public ok(): Option<T, "Some"> {
        return Option.Some<T, "Some">(this.v);
    }
    public err(): Option<E, "None"> {
        return Option.None<E, "None">();
    }
    public iter(): Iter<T> {
        return into_iter([this.v]);
    }
}
