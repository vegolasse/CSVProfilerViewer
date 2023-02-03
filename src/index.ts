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

import {parse, ParseResult} from "papaparse";
import {Chart} from "chart.js/auto";
import zoomPlugin from 'chartjs-plugin-zoom';
import "./PerformanceComparisonElement";
import {PerformanceComparisonElement} from "./PerformanceComparisonElement";
import {HTML} from "./HTML";

let tabs = [{
    thread:"GameThread",
    digits:3,
    suffix: " ms"
}, {
    thread:"RenderThread",
    digits:3,
    suffix: " ms"
}, {
    thread:"ActorCount",
    digits:0,
    suffix: ""
}, {
    thread:"Ticks",
    digits:0,
    suffix: ""
}, {
    thread:"DrawCall",
    digits:0,
    suffix: ""
}, {
    thread:"View",
    digits:1,
    suffix: ""
}];
let comparisons: PerformanceComparisonElement[] = []
let lastCsv = "";
let div = document.createElement("div");
let urlInput = HTML.tag('input', {type:"file", class:"file-input", "id":"file-input"},"");
let urlLabel = HTML.tag('label', {for:"file-input"}, "Input: ");
document.body.appendChild(urlLabel);
document.body.appendChild(urlInput);

let canvas = document.createElement("canvas");
div.appendChild(canvas);
div.style.width = "100%";
div.style.height = "400px";
Chart.register(zoomPlugin);
document.body.appendChild(div);
document.body.appendChild(HTML.tag("div", {}, "Click on one measurement in the graph and then another to compare them in the tabs below. Use scroll wheel to zoom."));
tabs.forEach( (config, index) => {
    document.body.appendChild(HTML.tag("input", {class: "tabview", type:"radio", "checked": index==0?"true":null, name:"tabs", id:"tab"+(index+1)}, ""));
    document.body.appendChild(HTML.tag("label",{class: "tabview", for:"tab"+(index+1)},config.thread));
});
tabs.forEach( (config, index) => {
    let comparisonElement: PerformanceComparisonElement = HTML.tag('performance-comparison',{
        thread:config.thread,
        digits:config.digits,
        suffix:config.suffix,
        class:"tab content"+(index+1)},"");
    document.body.appendChild(comparisonElement);
    comparisons.push(comparisonElement);
})

async function run()
{
    let csvString : string = lastCsv;
    if (csvString.length>0) {
        let table: ParseResult<{ [key: string]: string }> = parse(csvString, {header:true});
        let frameTimeSeries : number[] = [];
        let gameThreadTimeSeries : number[] = [];
        let renderThreadTimeSeries : number[] = [];
        let frameNumberLabels : number[] = [];
        for (let frameNumber = 0; frameNumber<Math.min(2000,table.data.length); ++frameNumber) {
            frameTimeSeries.push(Number.parseFloat(table.data[frameNumber]["FrameTime"]));
            gameThreadTimeSeries.push(Number.parseFloat(table.data[frameNumber]["GameThreadTime"]));
            renderThreadTimeSeries.push(Number.parseFloat(table.data[frameNumber]["RenderThreadTime"]));
            frameNumberLabels.push(frameNumber);
        }
        comparisons.forEach(comparison => {comparison.setTable(table)})

        new Chart(
            canvas,
            {
                options: {
                    animation: false,
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: {
                        zoom: {
                            zoom: {
                                wheel: {
                                    enabled: true,
                                },
                                pinch: {
                                    enabled: true
                                },
                                mode: 'x',
                            }
                        }
                    },
                    onClick: (event, elements, chart) => {
                        if (elements[0]) {
                            const frameNumber = elements[0].index;
                            comparisons.forEach(comparison => {comparison.addComparison(frameNumber)})
                        }
                    }
                },
                type: 'line',
                data: {
                    labels: frameNumberLabels,
                    datasets: [
                        {
                            label: 'Frame time (ms)',
                            data: frameTimeSeries
                        },
                        {
                            label: 'Game Thread (ms)',
                            data: gameThreadTimeSeries
                        },
                        {
                            label: 'Render Thread (ms)',
                            data: renderThreadTimeSeries
                        }
                    ]
                }
            }
        );
    }
}

urlInput.addEventListener("change", (e) => {
    console.log("read")

        if (!e.target) {
            return;
        }
        if (e.target instanceof HTMLInputElement && e.target.files)  {
            var file = e.target.files[0];
            var reader = new FileReader();
            reader.readAsText(file,'UTF-8');
            reader.onload = readerEvent => {
                console.log("read")
                if (readerEvent.target) {
                    var content = readerEvent.target.result;
                    if (!content) {
                        return;
                    }
                    if (content instanceof ArrayBuffer) {
                        // Shouldn't be an ArrayBuffer
                    } else
                    {
                        lastCsv =  content;
                        run().then()

                    }
                }
            }



    }
});

run().then()
