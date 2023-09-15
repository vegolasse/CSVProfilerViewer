/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2023 Lars Sjodin, Hati Hati Games AB
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
*/

import {ParseMeta, ParseResult} from "papaparse";
import {HTML} from "./HTML";
import 'chartjs-plugin-datalabels'
import {Chart} from "chart.js/auto";

interface PointInfo {
    x: number;
    y: number;
    alpha: number;
    frameTime: number;
}
export class MiniMapElement extends HTMLElement {
    private readonly HEATMAP_RADIUS_UNITS: number = 9600;
    private readonly MAX_FRAMES_TO_PROCESS: number = 60 * 3600;


    private table: ParseResult<{ [p: string]: string }> = {
        errors: [],
        data: [],
        meta: new class implements ParseMeta {
            aborted = true;
            cursor = 0;
            delimiter = ',';
            linebreak = '\n';
            truncated = false;
        }
    };
    private frameId: Int32Array[] = [new Int32Array()];

    constructor() {
        super();
    }

    connectedCallback() {
        if (this.table.data.length > 0) {
            this.render();
        }
    }

    disconnectedCallback() {

    }

    setTable(table: ParseResult<{ [key: string]: string }>) {
        this.table = table;
        if (this.isConnected) {
            this.render();
        }
    }

    adoptedCallback() {
    }

    static get observedAttributes(): string[] {
        return [];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {

    }


    private render(): void {
        this.innerText = "";
        let canvas = HTML.tag('canvas', {}, "");
        canvas.style.border = "1px solid gray";
        let cursorPositionDiv = HTML.tag('div', {}, "Position:");

            let parentDiv = this.appendChild(HTML.tag('div', {}, "",
            HTML.tag('div', {}, "Heatmap over frame time (blue=good, red=bad) Radius="+this.HEATMAP_RADIUS_UNITS),
            cursorPositionDiv,
            canvas));
        let table = this.table;
        let positions:PointInfo[] = [];
        let xMin = 1000000;
        let xMax = -1000000;
        let yMin = 1000000;
        let yMax = -1000000;
        canvas.addEventListener('mousemove', (event) => {
           let x = event.offsetX;
           let y = event.offsetY;
           let ix =Math.floor(x);
           let frame = 0;
          let iy = Math.floor(y);
          if (ix>=0 && ix<this.frameId.length && iy>=0 && iy<this.frameId[ix].length) {
              frame = this.frameId[ix][iy];
          }
           let mapX = xMin + (xMax - xMin) * x / canvas.width;
           let mapY = yMin + (yMax - yMin) * y / canvas.height;
            let timeMs: number = Number.parseFloat(this.table.data[frame]["FrameTime"]);
            cursorPositionDiv.innerText = "Position: " +
                mapX.toFixed(0) + ", " +
                mapY.toFixed(0)+ " (frame# "+frame+", "
                + timeMs.toFixed(0)+"ms)";
                ")";
        });
        let frameTimes : number[] = [];
        for (let frameNumber = 0; frameNumber < Math.min(this.MAX_FRAMES_TO_PROCESS, table.data.length); ++frameNumber) {
            let x = Number.parseFloat(table.data[frameNumber]["View/PosX"]);
            let y = Number.parseFloat(table.data[frameNumber]["View/PosY"]);
            let fx = Number.parseFloat(table.data[frameNumber]["View/ForwardX"]);
            let fy = Number.parseFloat(table.data[frameNumber]["View/ForwardY"]);
            let frameTime = Number.parseFloat(table.data[frameNumber]["FrameTime"]);

            if (!isNaN(x) && !isNaN(y) && !isNaN(fx) && !isNaN(fy)) {
                xMin = Math.min(x, xMin);
                xMax = Math.max(x, xMax);
                yMin = Math.min(y, yMin);
                yMax = Math.max(y, yMax);
                let alpha = Math.atan2(fy, fx);
                positions.push({x, y, alpha, frameTime});
                frameTimes.push(frameTime);
            }
        }
        let sortedFrameTimes: number[] = frameTimes.sort();
        let medianFrameTime = sortedFrameTimes[Math.floor(frameTimes.length / 2)];
        let percentile2 = sortedFrameTimes[Math.floor(frameTimes.length * 0.02)];
        let percintile98 = sortedFrameTimes[Math.floor(frameTimes.length * 0.98)];

        let maxSpan = Math.max(xMax - xMin, yMax - yMin) * 1.2;
        let xMiddle = (xMax + xMin) / 2
        let yMiddle = (yMax + yMin) / 2
        xMin = xMiddle - maxSpan / 2;
        xMax = xMiddle + maxSpan / 2;
        yMax = yMiddle + maxSpan / 2;
        yMin = yMiddle - maxSpan / 2;
        let aspectRatio = (xMax - xMin) / (yMax - yMin);
        this.reRenderCanvas(canvas, parentDiv, aspectRatio, positions, xMin, xMax, yMin, yMax, percentile2, percintile98);
        window.addEventListener('resize', () => {
            if (this.isConnected) {
                this.reRenderCanvas(canvas, parentDiv, aspectRatio, positions, xMin, xMax, yMin, yMax, percentile2, percintile98);
            }
        });
    }

     getHeapMapColor(frameBadness: number): number[] {
        if (frameBadness < 0) {
            frameBadness = 0;
        }
        let colors = [[0,0,128], [0, 0, 255], [0,255,0],[255, 255, 0], [255, 0, 0],[128, 0, 0]];
        let r = 0;
        let g = 0;
        let b = 0;
        let from = Math.min(Math.floor(frameBadness*colors.length), colors.length-1);
        let to = Math.min(from+1, colors.length-1);
        let fromColor = colors[from];
        let toColor = colors[to];
        let fromWeight = 1-(frameBadness*colors.length-from);
        let toWeight = 1-fromWeight;
        r = fromColor[0]*fromWeight + toColor[0]*toWeight;
        g = fromColor[1]*fromWeight + toColor[1]*toWeight;
        b = fromColor[2]*fromWeight + toColor[2]*toWeight;
        return [r, g, b];

    }

    private reRenderCanvas(canvas: HTMLCanvasElement, parentDiv: HTMLDivElement, aspectRatio: number, positions: PointInfo[], xMin: number, xMax: number, yMin: number, yMax: number, percentile2: number, percintile98: number): void {
        canvas.width = parentDiv.clientWidth-10;
        canvas.height = canvas.width / aspectRatio;
        let ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx == null) {
            return;
        }
        let context = ctx;
        //ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        let scale =  canvas.width/(xMax - xMin);
        let badnessValue : Float64Array[] = [];
        let sampleCounter : Float64Array[] = [];
        let frameDistance : Float64Array[] = [];
        this.frameId = [];
        for (let i = 0; i < canvas.width; ++i) {
            badnessValue.push(new Float64Array(canvas.height));
            sampleCounter.push(new Float64Array(canvas.height));
            frameDistance.push(new Float64Array(canvas.height));
            this.frameId.push(new Int32Array(canvas.height));
        }
        positions.forEach((position, frameNumber ) => {
            let x = (position.x - xMin)*scale;
            let y = (position.y - yMin)*scale;
            let coneRadius = this.HEATMAP_RADIUS_UNITS*scale;
            let frameBadness = (position.frameTime- percentile2)/(percintile98 - percentile2);
            this.drawCircle(badnessValue, sampleCounter, Math.floor(x), Math.floor(y), coneRadius, frameBadness);
            this.updateNearestFrame(frameDistance, this.frameId, Math.floor(x), Math.floor(y), frameNumber, coneRadius);
        });
        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        let data = imageData.data;
        let maxBadness = 0;
        let maxSamples = 0;
        badnessValue.forEach(value => {
            value.forEach(value1 => {
                maxBadness = Math.max(maxBadness, value1);
            })
        })
        sampleCounter.forEach(value => {
            value.forEach(value1 => {
                maxSamples = Math.max(maxSamples, value1);
            })
        });

        for (let x = 0; x < canvas.width; ++x) {
            for (let y = 0; y < canvas.height; ++y) {
                let frameBadness = 0;
                let index = (y * canvas.width + x) * 4;
                if (sampleCounter[x][y] != 0) {
                    frameBadness = badnessValue[x][y]/sampleCounter[x][y];
                    let c : number[] = this.getHeapMapColor(frameBadness);
                    data[index] = c[0]*sampleCounter[x][y]/maxSamples;
                    data[index + 1] = c[1]*sampleCounter[x][y]/maxSamples;
                    data[index + 2] = c[2]*sampleCounter[x][y]/maxSamples;
                    data[index + 3] = 255;
                } else
                {
                    data[index] = 0;
                    data[index + 1] = 0;
                    data[index + 2] = 0;
                    data[index + 3] = 255;
                }
            }
        }
        positions.forEach((position ) => {
            let x = (position.x - xMin)*scale;
            let y = (position.y - yMin)*scale;
            let index = (Math.floor(y) * canvas.width + Math.floor(x) )* 4;
            data[index] = 255;
            data[index + 1] = 255;
            data[index + 2] = 255;
            data[index + 3] = 255;
        });

        context.putImageData(imageData, 0, 0);
    }

    private drawCircle(a: Float64Array[],c: Float64Array[], x: number, y: number, coneRadius: number, frameBadness: number): void {
        let radiusSquared = coneRadius * coneRadius;
        let xMin = Math.max(0, x - coneRadius);
        let xMax = Math.min(a.length, x + coneRadius);
        let yMin = Math.max(0, y - coneRadius);
        let yMax = Math.min(a[0].length, y + coneRadius);
        for (let i = xMin; i < xMax; ++i) {
            for (let j = yMin; j < yMax; ++j) {
                let dx = i - x;
                let dy = j - y;
                let distanceSquared = dx * dx + dy * dy;
                if (distanceSquared < radiusSquared) {
                    a[Math.floor(i)][Math.floor(j)] +=frameBadness;
                    c[Math.floor(i)][Math.floor(j)] +=1;
                }
            }
        }
    }

    private updateNearestFrame(frameDistance: Float64Array[], frameId: Int32Array[], x: number, y: number, frameNumber: number, coneRadius: number): void {
        let radiusSquared = coneRadius * coneRadius;
        let xMin = Math.max(0, x - coneRadius);
        let xMax = Math.min(frameDistance.length, x + coneRadius);
        let yMin = Math.max(0, y - coneRadius);
        let yMax = Math.min(frameDistance[0].length, y + coneRadius);
        for (let i = xMin; i < xMax; ++i) {
            for (let j = yMin; j < yMax; ++j) {
                let dx = i - x;
                let dy = j - y;
                let distanceSquared = dx * dx + dy * dy;
                if (distanceSquared < radiusSquared) {
                    if (frameDistance[Math.floor(i)][Math.floor(j)]==0 || frameDistance[Math.floor(i)][Math.floor(j)] > distanceSquared) {
                        frameDistance[Math.floor(i)][Math.floor(j)] = distanceSquared;
                        frameId[Math.floor(i)][Math.floor(j)] = frameNumber;
                    }
                }
            }
        }
    }

}

window.customElements.define('mini-map', MiniMapElement);
declare global {
    interface HTMLElementTagNameMap {
        'mini-map': MiniMapElement;
    }
}