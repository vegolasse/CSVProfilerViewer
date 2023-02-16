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
import {Chart} from "chart.js/auto";
import 'chartjs-plugin-datalabels'
import zoomPlugin from "chartjs-plugin-zoom";

export class MiniMapElement extends HTMLElement
{
    private table: ParseResult<{ [p: string]: string }> = {
        errors: [],
        data:[],
        meta: new class implements ParseMeta {
            aborted = true;
            cursor=0;
            delimiter = ',';
            linebreak = '\n';
            truncated= false;
        }};
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {

    }
    setTable(table: ParseResult<{ [key: string]: string }>){
        this.table = table;
        if (this.isConnected) {
            this.render();
        }
    }

    adoptedCallback() {
    }

    static get observedAttributes() : string[] {
        return [];
    }

    attributeChangedCallback(name : string, oldValue : string, newValue : string)  {

    }

    private render(): void {
        this.innerText = "";
        let canvas = HTML.tag('canvas', {}, "");
        this.appendChild(HTML.tag('div', {}, "", canvas));
        let table = this.table;
        let positions : { x:number, y:number} []= [];
        let xMin = 1000000;
        let xMax = -1000000;
        let yMin = 1000000;
        let yMax = -1000000;
        for (let frameNumber = 0; frameNumber<Math.min(2000,table.data.length); ++frameNumber) {
            let x = Number.parseFloat(table.data[frameNumber]["View/PosX"]);
            let y = Number.parseFloat(table.data[frameNumber]["View/PosY"]);
            if (!isNaN(x) && !isNaN(y)) {
                xMin = Math.min(x,xMin);
                xMax = Math.max(x,xMax);
                yMin = Math.min(y,yMin);
                yMax = Math.max(y,yMax);
                positions.push({x,y});
            }
        }

        console.log("min "+xMin);
        console.log(xMax);
        let maxSpan = Math.max(xMax-xMin, yMax-yMin)*1.2;
        let xMiddle = (xMax+xMin)/2
        let yMiddle = (yMax+yMin)/2
        xMin = xMiddle-maxSpan/2;
        xMax = xMiddle+maxSpan/2;
        yMax = yMiddle+maxSpan/2;
        yMin = yMiddle-maxSpan/2;

        let chart = new Chart(
            canvas,
            {
                options: {

                    aspectRatio: 0.75,

                    animation: false,
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: {
                        datalabels : {
                            display: false,
                        },
                    },
                    scales: {
                        x: {
                            min:xMin,
                            max:xMax,
                            ticks: {
                                callback: function(value, index, ticks) {
                                    return parseFloat(""+value).toFixed(0) + " ";
                                }
                            }
                        },
                        y: {
                            min:yMin,
                            max:yMax,
                            ticks: {
                                callback: function(value, index, ticks) {
                                    return parseFloat(""+value).toFixed(0) + " ";
                                }
                            }
                        }
                    },

                },
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            showLine: true,
                            label: 'Player Position',
                            data: positions
                        },
                    ]
                }
            }
        );

    }
}

window.customElements.define('mini-map', MiniMapElement);
declare global {
    interface HTMLElementTagNameMap {
        'mini-map': MiniMapElement;
    }
}