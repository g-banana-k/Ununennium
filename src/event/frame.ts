export class Frame {
    private f: () => void;
    private anim_id: number;
    private canceled: boolean;
    public constructor(f: () => void) {
        this.f = f;
        const fr = () => {
            if (this.canceled) return;
            this.f();
            this.anim_id = requestAnimationFrame(fr);
        };
        this.anim_id = requestAnimationFrame(fr);
        this.canceled = false;
    }
    public cleanup() {
        cancelAnimationFrame(this.anim_id);
        this.canceled = true;
    }
}
