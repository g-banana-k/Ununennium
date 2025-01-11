import { describe, expect, it } from "vitest";
import { into_iter } from "../src/iterator/into_iter";
import { None } from "../src";

describe("iterator", () => {
    const arr = () => ["A", "B", "C", "D", "E"];
    const map = () =>
        new Map([
            ["a", "A"],
            ["b", "B"],
            ["c", "C"],
            ["d", "D"],
            ["e", "E"],
        ]);
    const set = () => new Set(["a", "b", "c", "d", "e"]);
    const none = () => None<string>().iter();
    it.each([[arr], [map], [set], [none]])(
        "into_iter",
        (f) => {
            const i = f();
            const a = [];
            const b = [];
            const c: unknown[] = [];
            for (const e of i) {
                a.push(e);
            }
            for (const e of into_iter(i)) {
                b.push(e);
            }
            into_iter(i).for_each((e)=>{
                c.push(e);
            });
            expect(a).toEqual(b);
            expect(a).toEqual(c);
        },
        { timeout: 1000 },
    );
    it.each([[arr], [map], [set], [none]])(
        "map",
        (f) => {
            const i = f();
            const a = [];
            const b = [];
            for (const e of i) {
                a.push(`${e}${e}`);
            }
            for (const e of into_iter(i).map(s=>`${s}${s}`)) {
                b.push(e);
            }
            expect(a).toEqual(b);
        },
        { timeout: 1000 },
    );
});
