import type { Iter, Iterable } from "../iterator/index.js";
import { into_iter } from "../iterator/into_iter.js";
import { Result } from "./result.js";

type Cond<K, S, N, U = S | N> = K extends "Some"
    ? K extends "None"
        ? U
        : S
    : N;

type SN = "Some" | "None";

export type Option<T, K extends SN = SN> = K extends "Some"
    ? OptionI<T, "Some">
    : never & K extends "None"
      ? OptionI<T, "None">
      : never;

interface OptionI<T, K extends SN = SN> extends Iterable<T> {
    unwrap(): Cond<K, T, never>;
    unwrap_or(d: T): T;
    unwrap_or_else(f: () => T): T;
    is_some(): this is Option<T, "Some">;
    is_some_and(f: (arg0: T) => boolean): boolean;
    is_none(): this is Option<T, "None">;
    is_none_or(f: (arg0: T) => boolean): boolean;
    map<U>(f: (arg0: T) => U): Option<U, K>;
    and<U, L extends SN = SN>(ob: Option<U, L>): Option<U, Cond<K, L, "None">>;
    and_then<U, L extends SN = SN>(
        f: (arg0: T) => Option<U, L>,
    ): Option<U, Cond<K, L, "None">>;
    or<L extends SN = SN>(ob: Option<T, L>): Option<T, Cond<K, "Some", L>>;
    or_else<L extends SN = SN>(
        f: () => Option<T, L>,
    ): Option<T, Cond<K, "Some", L>>;
    ok_or<E>(e: E): Result<T, E, Cond<K, "Ok", "Err">>;
    ok_or_else<E>(f: () => E): Result<T, E, Cond<K, "Ok", "Err">>;
    filter(f: (arg0: T) => boolean): Option<T, Cond<K, SN, "None">>;
    zip<U, L extends SN = SN>(
        ob: Option<U, L>,
    ): Option<[T, U], Cond<K, L, "None">>;
}

type OptionT = {
    Some<T, K extends SN = SN>(v: T): Option<T, K>;
    None<T, K extends SN = SN>(): Option<T, K>;
    from<T>(v: T | null | undefined): Option<T, SN>;
    from<T>(v: null | undefined): Option<T, "None">;
    from<T>(v: T): Option<T, "Some">;
    all<T>(arr: Option<T>[]): Option<T[]>;
    any<T>(arr: Option<T>[]): Option<T>;
};

export const Option: OptionT = {
    Some: <T>(v: T) => new OptionS<T>(v) as never,
    None: <T>() => new OptionN<T>() as never,
    from: <T>(v: T | null | undefined) => {
        if (v === undefined || v === null) {
            return Option.None() as never;
        } else {
            return Option.Some<T>(v) as never;
        }
    },
    all: <T>(arr: Option<T>[]) => {
        const res = [];
        for (const o of arr) {
            if (o.is_some()) {
                res.push(o.unwrap());
            } else {
                return Option.None();
            }
        }
        return Option.Some(res);
    },
    any: <T>(arr: Option<T>[]) => {
        for (const o of arr) {
            if (o.is_some()) {
                return o;
            }
        }
        return Option.None();
    },
};

export const Some = <T>(v: T) => Option.Some(v);
export const None = <T>() => Option.None<T>();

class OptionN<T> implements OptionI<T, "None"> {
    public unwrap(): never {
        throw new Error("unwrap");
    }
    public unwrap_or(d: T): T {
        return d;
    }
    public unwrap_or_else(f: () => T): T {
        return f();
    }
    public is_some(): this is Option<T, "Some"> {
        return false;
    }
    public is_some_and(): false {
        return false;
    }
    public is_none(): this is Option<T, "None"> {
        return true;
    }
    public is_none_or(): boolean {
        return true;
    }
    public map<U>(): Option<U, "None"> {
        return Option.None<U, "None">();
    }
    public and<U>(): Option<U, "None"> {
        return Option.None<U, "None">();
    }
    public and_then<U>(): Option<U, "None"> {
        return Option.None<U, "None">();
    }
    public or<L extends SN = SN>(ob: Option<T, L>): Option<T, L> {
        return ob;
    }
    public or_else<L extends SN = SN>(f: () => Option<T, L>): Option<T, L> {
        return f();
    }
    public ok_or<E>(e: E): Result<T, E, "Err"> {
        return Result.Err<T, E, "Err">(e);
    }
    public ok_or_else<E>(f: () => E): Result<T, E, "Err"> {
        return Result.Err<T, E, "Err">(f());
    }
    public filter(): Option<T, "None"> {
        return Option.None<T, "None">();
    }
    public zip<U>(): Option<[T, U], "None"> {
        return Option.None<[T, U], "None">();
    }
    public iter(): Iter<T> {
        return into_iter([]);
    }
}

class OptionS<T> implements OptionI<T, "Some"> {
    private v: T;
    constructor(v: T) {
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
    public is_some(): this is Option<T, "Some"> {
        return true;
    }
    public is_some_and(f: (arg0: T) => boolean): boolean {
        return f(this.v);
    }
    public map<U>(f: (arg0: T) => U): Option<U, "Some"> {
        return Option.Some<U, "Some">(f(this.unwrap()));
    }
    public is_none(): this is Option<T, "None"> {
        return false;
    }
    public is_none_or(f: (arg0: T) => boolean): boolean {
        return f(this.v);
    }
    public and<U, L extends SN = SN>(ob: Option<U, L>): Option<U, L> {
        return ob;
    }
    public and_then<U, L extends SN = SN>(
        f: (arg0: T) => Option<U, L>,
    ): Option<U, L> {
        return f(this.v);
    }
    public or(): Option<T, "Some"> {
        return this as Option<T, "Some">;
    }
    public or_else(): Option<T, "Some"> {
        return this as Option<T, "Some">;
    }
    public ok_or<E>(): Result<T, E, "Ok"> {
        return Result.Ok<T, E, "Ok">(this.v);
    }
    public ok_or_else<E>(): Result<T, E, "Ok"> {
        return Result.Ok<T, E, "Ok">(this.v);
    }
    public filter(f: (arg0: T) => boolean): Option<T> {
        if (f(this.v)) {
            return Option.Some(this.v);
        } else {
            return Option.None();
        }
    }
    public zip<U, L extends SN = SN>(ob: Option<U, L>): Option<[T, U], L> {
        if (ob.is_some()) {
            return Option.Some([this.v, ob.unwrap()]);
        } else {
            return Option.None();
        }
    }
    public iter(): Iter<T> {
        return into_iter([this.v]);
    }
}
