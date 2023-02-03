import {ParseMeta, ParseResult} from "papaparse";
import {HTML} from "./HTML";
import {TSMap} from "./TSMap";

export class PerformanceComparisonElement extends HTMLElement
{
    labelRow: TSMap<string, number> = new TSMap();
    comparisonTable: {label:string, left : number, right: number, percentageDiff: number}[] = [];
    sortColumn : 0|1|2|3 = 0;
    sortOrder : 1|-1 = 1;
    frameNumbers: number[] = [0,0];
    threadName = "";
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
    private digits: number = 3;
    private suffix: string = " ms";


    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {

    }

    adoptedCallback() {
    }

    static get observedAttributes() : string[] {
        return ["thread", "digits", "suffix"];
    }

    attributeChangedCallback(name : "thread"| "digits"| "suffix", oldValue : string, newValue : string)  {
        if (name === "thread") {
            this.threadName = newValue;
        } else if (name === "digits") {
            this.digits = Number.parseInt(newValue);
        } else if (name === "suffix") {
            this.suffix = newValue;
        }
        if (this.isConnected) {
            this.render();
        }
    }

    setTable(table: ParseResult<{ [key: string]: string }>){
        this.table = table;
        if (this.isConnected) {
            this.render();
        }
        this.addComparison(0);
        this.addComparison(1);
    }

    addComparison(frameNumber: number): void {
        this.frameNumbers = [this.frameNumbers[1]];
        this.frameNumbers.push(frameNumber);
        console.log("click");
        this.comparisonTable.forEach(row => {
            row.left = row.right;
            row.right = 0.0;
            row.percentageDiff = 0.0;
        })
        this.table.meta.fields?.forEach((columnName : string )=> {
            if (columnName.match(new RegExp(`${this.threadName}/`))) {
                let label = columnName;
                let comparisonRowNumber : number = this.labelRow.computeIfAbsent(label, (key) => {
                    this.comparisonTable.push({label:label.replace(new RegExp(`${this.threadName}/`), ".../"), left:0, right:0, percentageDiff:0});
                    return this.comparisonTable.length-1;
                });
                let row: { label: string; left: number; right: number; percentageDiff: number } = this.comparisonTable[comparisonRowNumber];
                row.right = Number.parseFloat(this.table.data[frameNumber][columnName]);
                row.percentageDiff = 100*(row.right/row.left)-100;
            }
        });
        this.render();
    }

    private render(): void {
        this.innerText = '';
        switch (this.sortColumn) {
            case 0:
                this.comparisonTable.sort((first, second) => this.sortOrder*first.label.localeCompare(second.label));
                break;
            case 1:
                this.comparisonTable.sort((first, second) => this.sortOrder*(first.left - second.left));
                break;
            case 2:
                this.comparisonTable.sort((first, second) => this.sortOrder*(first.right - second.right));
                break;
            case 3:
                this.comparisonTable.sort((first, second) => this.sortOrder*(first.percentageDiff - second.percentageDiff));
                break;
            default:
                const missingCase: never = this.sortColumn;
        }
        let table = HTML.tag("table", {}, "");
        let labelColumn: HTMLTableCellElement, leftColumn, rightColumn, diffColumn;
        let headerRow = HTML.tag("tr", {"align":"left"}, "",
            labelColumn = HTML.tag("th", {"class":this.sortColumn==0?(this.sortOrder==1?"ascending":"descending"):"nosort"}, `${this.threadName}`),
            leftColumn = HTML.tag("th", {"class":this.sortColumn==1?(this.sortOrder==1?"ascending":"descending"):"nosort"}, `Frame #${this.frameNumbers[0]}`),
            rightColumn = HTML.tag("th", {"class":this.sortColumn==2?(this.sortOrder==1?"ascending":"descending"):"nosort"}, `Frame #${this.frameNumbers[1]}`),
            diffColumn = HTML.tag("th", {"class":this.sortColumn==3?(this.sortOrder==1?"ascending":"descending"):"nosort"}, "Diff"),
        );
        let newSortColumn = 0;
        labelColumn.addEventListener("click", ev => {
            if (this.sortColumn == 0) {
                this.sortOrder = this.sortOrder == 1?-1:1;
            } else {
                this.sortOrder = 1;
            }
            this.sortColumn = 0;
            this.render();
        });
        leftColumn.addEventListener("click", ev => {
            if (this.sortColumn == 1) {
                this.sortOrder = this.sortOrder == 1?-1:1;
            } else {
                this.sortOrder = 1;
            }
            this.sortColumn = 1;
            this.render();
        });
        rightColumn.addEventListener("click", ev => {
            if (this.sortColumn == 2) {
                this.sortOrder = this.sortOrder == 1?-1:1;
            } else {
                this.sortOrder = 1;
            }
            this.sortColumn = 2;
            this.render();
        });
        diffColumn.addEventListener("click", ev => {
            if (this.sortColumn == 3) {
                this.sortOrder = this.sortOrder == 1?-1:1;
            } else {
                this.sortOrder = 1;
            }
            this.sortColumn = 3;
            this.render();
        });
        table.appendChild(headerRow);
        this.comparisonTable.forEach(row => {
            let className = "neutral";
            if (row.percentageDiff>0) {
                className = "positive";
            }
            if (row.percentageDiff<0) {
                className = "negative";
            }
            let dataRow = HTML.tag("tr", {align:"right", "class":className}, "",
                 HTML.tag("td", {align:"left"}, row.label),
                 HTML.tag("td", {}, row.left.toFixed(this.digits)+ this.suffix),
                 HTML.tag("td", {}, row.right.toFixed(this.digits)+  this.suffix),
                 HTML.tag("td", {}, (row.percentageDiff>=0?"+":"")+row.percentageDiff.toFixed(1)+ " %"),
            );
            table.appendChild(dataRow);
        })
        this.appendChild(table);


    }
}
