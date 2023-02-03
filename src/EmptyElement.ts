import {PerformanceComparisonElement} from "./PerformanceComparisonElement";

class EmptyElement extends HTMLElement
{
    constructor() {
        super();
    }

    connectedCallback() {

    }

    disconnectedCallback() {

    }

    adoptedCallback() {
    }

    static get observedAttributes() : string[] {
        return [];
    }

    attributeChangedCallback(name : string, oldValue : string, newValue : string)  {

    }

}

window.customElements.define('empty-element', EmptyElement);
declare global {
    interface HTMLElementTagNameMap {
        'empty-element': EmptyElement;
    }
}