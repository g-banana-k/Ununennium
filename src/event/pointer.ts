import { None, type Option, Some } from "../types/option.js";
import { Frame } from "./frame.js";

class Builder {
    private on_mousedown_f: Option<(e: PointerEvent) => void>;
    private on_mouseup_f: Option<(e: PointerEvent) => void>;
    private on_mousemove_f: Option<(e: PointerEvent) => void>;
    public constructor() {
        this.on_mousedown_f = None();
        this.on_mouseup_f = None();
        this.on_mousemove_f = None();
    }
    public on_mousedown(f: (e: PointerEvent) => void) {
        this.on_mousedown_f = Some(f);
        return this;
    }
    public on_mouseup(f: (e: PointerEvent) => void) {
        this.on_mouseup_f = Some(f);
        return this;
    }
    public on_mousemove(f: (e: PointerEvent) => void) {
        this.on_mousemove_f = Some(f);
        return this;
    }
    public build() {
        return new PointerHandler(
            this.on_mousedown_f,
            this.on_mouseup_f,
            this.on_mousemove_f,
        );
    }
}

export class PointerHandler {
    private mousedown: Option<PointerEvent>;
    private mouseup: Option<PointerEvent>;
    private mousemove: Option<PointerEvent>;
    private on_mousedown_f: Option<(e: PointerEvent) => void>;
    private on_mouseup_f: Option<(e: PointerEvent) => void>;
    private on_mousemove_f: Option<(e: PointerEvent) => void>;
    private mousedown_handler_capture: (e: PointerEvent) => void;
    private mousedown_handler: (e: PointerEvent) => void;
    private mouseup_handler: (e: PointerEvent) => void;
    private mousemove_handler: (e: PointerEvent) => void;
    private frame: Frame;
    private elements: Set<{ elem: HTMLElement; capture: boolean }>;
    public constructor(
        on_mousedown_f: Option<(e: PointerEvent) => void>,
        on_mouseup_f: Option<(e: PointerEvent) => void>,
        on_mousemove_f: Option<(e: PointerEvent) => void>,
    ) {
        this.mousedown = None();
        this.mouseup = None();
        this.mousemove = None();
        this.on_mousedown_f = on_mousedown_f;
        this.on_mouseup_f = on_mouseup_f;
        this.on_mousemove_f = on_mousemove_f;
        this.mousedown_handler_capture = (e: PointerEvent) => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            this.mousedown = Some(e);
        };
        this.mousedown_handler = (e: PointerEvent) => {
            this.mousedown = Some(e);
        };
        this.mouseup_handler = (e: PointerEvent) => {
            this.mouseup = Some(e);
        };
        this.mousemove_handler = (e: PointerEvent) => {
            this.mousemove = Some(e);
        };

        this.frame = new Frame(() => {
            this.on_mousedown_f.zip(this.mousedown).map(([fn, e]) => fn(e));
            this.on_mouseup_f.zip(this.mouseup).map(([fn, e]) => fn(e));
            this.on_mousemove_f.zip(this.mousemove).map(([fn, e]) => fn(e));
            this.mousedown = None();
            this.mouseup = None();
            this.mousemove = None();
        });
        this.elements = new Set();
    }
    public handlers(capture = false) {
        return {
            onPointerDown: capture
                ? this.mousedown_handler_capture
                : this.mousedown_handler,
            onPointerUp: this.mouseup_handler,
            onPointerMove: this.mousemove_handler,
        };
    }
    public add_event_listener<E extends HTMLElement>(e: E, capture = false) {
        const { onPointerDown, onPointerUp, onPointerMove } =
            this.handlers(capture);
        e.addEventListener("pointerdown", onPointerDown);
        e.addEventListener("pointerup", onPointerUp);
        e.addEventListener("pointermove", onPointerMove);
        this.elements.add({ elem: e, capture });
    }
    public remove_event_listener<E extends HTMLElement>(e: E, capture = false) {
        const { onPointerDown, onPointerUp, onPointerMove } =
            this.handlers(capture);
        e.removeEventListener("pointerdown", onPointerDown);
        e.removeEventListener("pointerup", onPointerUp);
        e.removeEventListener("pointermove", onPointerMove);
        this.elements.delete({ elem: e, capture });
    }
    public cleanup() {
        this.frame.cleanup();
        for (const { elem, capture } of this.elements) {
            this.remove_event_listener(elem, capture);
        }
    }
    public static Builder = Builder;
}
