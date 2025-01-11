import { None, Some } from "../types/option.js";
import { type Iter, IterC, type IterCore, type Iterable } from "./index.js";

type IntoIter = (<T>(v: T[]) => Iter<T>) &
    (<T, K>(v: Map<K, T>) => Iter<[K, T]>) &
    (<T>(v: Set<T>) => Iter<T>) &
    (<T>(v: Iterable<T>) => Iter<T>) &
    (<T>(v: IterCore<T>) => Iter<T>) &
    (<T, K>(
        v: T[] | Map<K, T> | Set<T> | Iterable<T> | IterCore<T>,
    ) => Iter<T> | Iter<[T, K]>);

export const into_iter: IntoIter = (<T, K>(
    v: T[] | Map<K, T> | Set<T> | Iterable<T> | IterCore<T>,
) => {
    if (isIterCore(v)) return new IterC(v);
    if (isIterable(v)) return v.iter();
    if (Array.isArray(v)) {
        let i = 0;
        return new IterC<T>({
            next: () => {
                if (!(i < v.length)) return None();
                i += 1;
                return Some(v[i - 1]);
            },
        });
    }
    if (v instanceof Set) {
        const keys = v.keys();
        return new IterC<T>({
            next: () => {
                const n = keys.next();
                if (n.done) return None();
                else return Some(n.value);
            },
        });
    }
    if (v instanceof Map) {
        const entries = v.entries();
        return new IterC<[K, T]>({
            next: () => {
                const n = entries.next();
                if (n.done) return None();
                else return Some(n.value);
            },
        });
    }
    return undefined as never;
}) as unknown as IntoIter;

const isIterable = (v: unknown): v is Iterable<unknown> => {
    return (
        (typeof v === "object" &&
            v &&
            "iter" in v &&
            typeof v.iter === "function" &&
            true) ??
        false
    );
};

const isIterCore = (v: unknown): v is IterCore<unknown> => {
    return (
        (typeof v === "object" &&
            v &&
            "next" in v &&
            typeof v.next === "function" &&
            true) ??
        false
    );
};
