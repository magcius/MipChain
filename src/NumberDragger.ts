
const MONOSPACE = '"Source Code Pro", "Droid Sans Mono", monospace';

interface NumberDraggerSeg extends HTMLDivElement {
    _incr: number;
}

export class NumberDragger {
    public onvalue: ((newValue: number) => void) | null = null;
    public onend: (() => void) | null = null;

    private toplevel: HTMLElement;
    private segments: NumberDraggerSeg[];
    private anchorMouseX: number;
    private anchorValue: number | null = null;
    private value: number | null = null;
    private currentIncr: number;
    private showTimeout: number;

    constructor(private _document: HTMLDocument) {
        // User callback.
        this.onvalue = null;
        this.onend = null;

        this.toplevel = this._document.createElement('div');
        this.toplevel.style.position = 'absolute';
        this.toplevel.style.transform = 'translate(0, 0)';
        this.toplevel.style.fontFamily = MONOSPACE;
        this.toplevel.style.backgroundColor = '#232323';
        this.toplevel.style.color = '#c93';
        this.toplevel.style.border = '2px solid #c93';
        this.toplevel.style.lineHeight = '1em';
        this.toplevel.style.marginLeft = '1em';
        this.toplevel.style.borderRadius = '6px';
        this.toplevel.style.boxShadow = 'rgba(0, 0, 0, .4) 0px 4px 16px';
        this.toplevel.style.zIndex = '9999';
        this.toplevel.style.pointerEvents = 'none';

        this.segments = [];
        for (let exp = 2; exp >= 0; exp--) {
            const incr = Math.pow(10, exp);
            const segment = this._document.createElement('div') as NumberDraggerSeg;
            segment._incr = incr;
            segment.style.padding = '.5em 1em';
            segment.textContent = '' + incr;
            this.toplevel.appendChild(segment);
            this.segments.push(segment);
        }

        this.anchorMouseX = 0;
        this.anchorValue = null;
        this.value = null;
    }

    private _onMouseMove = (e: MouseEvent) => {
        e.stopPropagation();
        const accel = 15;
        const dx = Math.round((e.clientX - this.anchorMouseX) / accel);
        const newValue = this.anchorValue! + (dx * this.currentIncr);
        if (this.value !== newValue) {
            this.value = newValue;
            if (this.onvalue !== null)
                this.onvalue(this.value);
        }

        const y = e.clientY;
        for (const segment of this.segments) {
            const bbox = segment.getBoundingClientRect();
            if (y < bbox.bottom) {
                if (this._selectSegment(segment)) {
                    // Set new anchor.
                    if (this.anchorValue !== this.value) {
                        this.anchorMouseX = e.clientX;
                        this.anchorValue = this.value;
                    }
                }
                break;
            }
        }
    };

    public hide(): void {
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = 0;
            return;
        }

        if (this.toplevel.parentElement === null)
            return;

        this._document.documentElement.removeEventListener('mouseup', this._onMouseUp);
        if (this.onend !== null)
            this.onend();

        this._document.documentElement.removeEventListener('mousemove', this._onMouseMove, { capture: true });
        this._document.body.removeChild(this.toplevel);
    }

    private _onMouseUp = (e: MouseEvent) => {
        this.hide();
    }

    private _selectSegment(segment: NumberDraggerSeg) {
        const incr = segment._incr;
        if (this.currentIncr === incr)
            return false;
        this.currentIncr = incr;

        for (const seg of this.segments) {
            const hilite = seg === segment;
            seg.style.backgroundColor = hilite ? '#c93' : '';
            seg.style.color = hilite ? '#222' : '';
            seg.style.fontWeight = hilite ? 'bold' : '';
        }
        return true;
    }

    private _show() {
        this.showTimeout = 0;
        this._document.body.appendChild(this.toplevel);
        this._document.documentElement.addEventListener('mousemove', this._onMouseMove, { capture: true });
    }

    public setPosition(x: number, y: number) {
        this.toplevel.style.left = x + 'px';
        this.toplevel.style.top = y + 'px';
    }

    public show(value: number, e: MouseEvent) {
        this.anchorMouseX = e.clientX;
        this.anchorValue = value;

        // Select default segment based on powers of 10.
        let segmentExp = 0;
        for (let exp = -2; exp <= 2; exp++) {
            const incr = Math.pow(10, exp + 1);
            if (value > -incr && value < incr) {
                segmentExp = exp;
                break;
            }
        }

        // segmentExp between -2 and 2. Our indexes range from 2 to -2.
        const segmentIdx = 4 - (segmentExp + 2);
        this._selectSegment(this.segments[segmentIdx]);

        // Adjust the transform so the center of the segment box is in the middle.
        const pcts = ['-10.5%', '-50%', '-89.5%'];
        this.toplevel.style.transform = `translate(0, ${pcts[segmentIdx]}`;

        this._document.documentElement.addEventListener('mouseup', this._onMouseUp);
        // Delay the show a tiny bit...
        this.showTimeout = window.setTimeout(this._show.bind(this), 100);
    }
}

export function bindNumberDragger(input: HTMLInputElement, onchange: (value: number) => void): void {
    const numberDragger = new NumberDragger(document);
    input.onmousedown = (e) => {
        numberDragger.setPosition(e.clientX, e.clientY);
        numberDragger.show(input.valueAsNumber, e);
        e.stopPropagation();
    };
    input.onblur = () => {
        numberDragger.hide();
    };
    input.ondragstart = (e) => {
        e.preventDefault();
    };
    numberDragger.onvalue = (value) => {
        onchange(value);
    };
}
