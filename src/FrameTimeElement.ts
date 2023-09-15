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
import ChartDataLabels from "chartjs-plugin-datalabels";
Chart.register(ChartDataLabels);

export class FrameTimeElement extends HTMLElement
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

    private readonly MAX_FRAMES_TO_PROCESS: number = 60*3600;

    private render(): void {
        this.innerText = "";
        let canvas = HTML.tag('canvas', {}, "");
        this.appendChild(HTML.tag('div', {}, "", canvas));
        let table = this.table;
        let frameTimes: number[] = []
        let totalFrameCount = 0;
        for (let frameNumber = 0; frameNumber<Math.min(this.MAX_FRAMES_TO_PROCESS,table.data.length); ++frameNumber) {
            let frameTime = Number.parseFloat(table.data[frameNumber]["FrameTime"]);
            frameTimes.push(frameTime);
            totalFrameCount++;
        }
        let sortedFrameRates = frameTimes.sort();
        let percentile98 = sortedFrameRates[Math.floor(sortedFrameRates.length*0.98)];
        let median = sortedFrameRates[Math.floor(sortedFrameRates.length*0.5)];
        let percentile2 = sortedFrameRates[Math.floor(sortedFrameRates.length*0.02)];
        let binSize = 0;

        let bins: number[] = [];
        let binLabels: string[] = [];
        let firstBinValue;

        do {
            binSize++;
            bins = [];
            binLabels=[];
            firstBinValue = Math.floor(percentile2/binSize)*binSize-2;
            let lastBinValue: number = Math.floor(percentile98/binSize)*binSize+2;
            for (let frameRate = firstBinValue; frameRate< lastBinValue; frameRate+=binSize) {
                bins.push(0.0)
                binLabels.push(frameRate.toString());
            }
        } while (bins.length>15)

        binLabels[0] = "≤ "+binLabels[0]
        binLabels[binLabels.length-1] = "≥ "+binLabels[binLabels.length-1]
        for (let frameNumber = 0; frameNumber<Math.min(this.MAX_FRAMES_TO_PROCESS,table.data.length); ++frameNumber) {
            let frameTime = Number.parseFloat(table.data[frameNumber]["FrameTime"]);
            let binIndex: number = Math.floor((frameTime-firstBinValue)/binSize);
            binIndex = Math.max(0,binIndex);
            binIndex = Math.min(bins.length-1, binIndex);
            bins[binIndex] += 100/totalFrameCount;
        }

        new Chart(
            canvas,
            {
                options: {
                    aspectRatio: 1,
                    animation: false,
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: {
                        datalabels : {
                            anchor : "end",
                            align: "end",
                            padding: 0,
                            offset: -1,
                            font: {
                              size: 9
                            },
                            formatter: value => {
                                return value.toFixed(1);
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'ms'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Percent of frames'
                            },
                            ticks: {
                                callback: function(value, index, ticks) {
                                    return value + " %";
                                }
                            }
                        }
                    },

                },
                type: 'bar',
                data: {
                    labels: binLabels,
                    datasets: [
                        {
                            label: 'FrameTime (ms)',
                            data: bins
                        },
                    ]
                }
            }
        );

    }
}

window.customElements.define('frame-time', FrameTimeElement);
declare global {
    interface HTMLElementTagNameMap {
        'frame-time': FrameTimeElement;
    }
}