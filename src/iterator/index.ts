import { None, type Option, Some } from "../types/option.js";

export interface IterCore<T> {
    next(): Option<T>;
}

export interface Iterable<T> {
    iter(): Iter<T>;
}

export interface Iter<T> extends Iterable<T> {}
export interface Iter<T> extends IterCore<T> {}
export interface Iter<T> {
    last(): Option<T>;
    nth(n: number): Option<T>;
    find(f: (arg0: T) => boolean): Option<T>;
    map<U>(f: (arg0: T) => U): Iter<U>;
    filter(f: (arg0: T) => boolean): Iter<T>;
    flat_map<U>(f: (arg0: T) => Iterable<U>): Iter<U>;
    enumerate(): Iter<[number, T]>;
    take(n: number): Iter<T>;
    skip(n: number): Iter<T>;
    step_by(n: number): Iter<T>;
    chain(...ib: Iter<T>[]): Iter<T>;
    zip<U>(ib: Iter<U>): Iter<[T, U]>;
    fold<U>(init: U, f: (a: U, c: T) => U): U;
    inspect(f: (arg0: T) => void): Iter<T>;
    for_each(f: (arg0: T) => void): void;
    count(): number;
    [Symbol.iterator](): Iterator<T>;
}

type IterT = {};
export const Iter: IterT = {};

export class IterC<T> implements Iter<T> {
    private core: IterCore<T>;
    public constructor(core: IterCore<T>) {
        this.core = core;
    }
    public next(): Option<T> {
        return this.core.next();
    }
    public iter(): Iter<T> {
        return this;
    }
    public last(): Option<T> {
        let v = None<T>();
        while (true) {
            const c = this.next();
            if (c.is_some()) {
                v = c;
            } else {
                break;
            }
        }
        return v;
    }
    public nth(n: number): Option<T> {
        for (let i = 0; i <= n; i++) {
            const c = this.next();
            if (c.is_none()) return None();
            if (i === n) return c;
        }
        return None();
    }
    public find(f: (arg0: T) => boolean): Option<T> {
        while (true) {
            const c = this.next();
            if (c.is_none()) return None();
            if (f(c.unwrap())) return c;
        }
    }
    public map<U>(f: (arg0: T) => U): Iter<U> {
        return new IterC({
            next: () => {
                return this.next().map(f);
            },
        });
    }
    public filter(f: (arg0: T) => boolean): Iter<T> {
        return new IterC({
            next: () => {
                let v = this.next();
                if (v.is_none()) return None<T>();
                while (!f(v.unwrap())) {
                    v = this.next();
                    if (v.is_none()) return None<T>();
                }
                return v;
            },
        });
    }
    public flat_map<U>(f: (arg0: T) => Iterable<U>): Iter<U> {
        let c = None<Iter<U>>();
        return new IterC({
            next: () => {
                while (c.is_none()) {
                    const n = this.next();
                    if (n.is_none()) return None();
                    c = Some(f(n.unwrap()).iter());
                    const v = c.unwrap().next();
                    if (v.is_none()) c = None();
                    else return v;
                }
                const v = c.unwrap().next();
                if (v.is_none()) c = None();
                return v;
            },
        });
    }
    public enumerate(): Iter<[number, T]> {
        let i = 0;
        return new IterC({
            next: () => {
                const v = this.next();
                i += 1;
                if (v.is_none()) return None();
                return Some([i - 1, v.unwrap()]);
            },
        });
    }
    public take(n: number): Iter<T> {
        let i = 0;
        return new IterC({
            next: () => {
                if (!(i < n)) return None();
                i += 1;
                return this.next();
            },
        });
    }
    public skip(n: number): Iter<T> {
        for (let i = 0; i < n; i++) this.next();
        return new IterC({
            next: this.next,
        });
    }
    public step_by(n: number): Iter<T> {
        return new IterC({
            next: () => {
                const v = this.next();
                for (let i = 0; i < n - 1; i++) this.next();
                return v;
            },
        });
    }
    public chain(...ib: Iter<T>[]): Iter<T> {
        let c = Some<Iter<T>>(this);
        let i = 0;
        return new IterC({
            next: () => {
                while (c.is_none()) {
                    if (!(i < ib.length)) return None();
                    c = Some(ib[i]);
                    i += 1;
                    const v = c.unwrap().next();
                    if (v.is_none()) c = None();
                    else return v;
                }
                const v = c.unwrap().next();
                if (v.is_none()) c = None();
                return v;
            },
        });
    }
    public zip<U>(ib: Iter<U>): Iter<[T, U]> {
        return new IterC({
            next: () => {
                const a = this.next();
                const b = ib.next();
                return a.zip(b);
            },
        });
    }
    public inspect(f: (arg0: T) => void): Iter<T> {
        return new IterC({
            next: () => {
                const v = this.next();
                if (v.is_some()) f(v.unwrap());
                return v;
            },
        });
    }
    public fold<U>(init: U, f: (a: U, c: T) => U): U {
        let v = init;
        this.for_each((c) => {
            v = f(v, c);
        });
        return v;
    }
    public for_each(f: (arg0: T) => void): void {
        while (true) {
            const v = this.next();
            if (v.is_none()) break;
            else f(v.unwrap());
        }
    }
    public count(): number {
        let i = 0;
        this.for_each(() => i++);
        return i;
    }
    public all(f: (arg0: T) => boolean): boolean {
        return this.fold(true, (a, c) => a && f(c));
    }
    public any(f: (arg0: T) => boolean): boolean {
        return this.fold(false, (a, c) => a || f(c));
    }
    [Symbol.iterator](): Iterator<T> {
        return {
            next: () => {
                const v = this.next();
                if (v.is_some()) {
                    return {
                        value: v.unwrap(),
                        done: false,
                    };
                } else {
                    return {
                        value: undefined,
                        done: true,
                    };
                }
            },
        };
    }
}
