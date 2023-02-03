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

export class HTML {
    /**
     * Method to create a HTML Tag with attributes, text and optionally children.
     * @param {K} tagName A valid HTML tag name
     * @param {{[p: string]: string | number | null}} attributes Attributes as an object with the attribute name as key. A null value means it won't be set and is useful when working with the "checked" attribute.
     * @param {string} text The innerText to set on the node
     * @param {HTMLElement} children Children to add.
     * @returns {HTMLElementTagNameMap[K]} The newly created element with the correct type as looked up in the HTMLElementTagNameMap
     */
    static tag<K extends keyof HTMLElementTagNameMap>(tagName:K, attributes : {[key: string] : string|number|null}, text : string, ...children : HTMLElement[]): HTMLElementTagNameMap[K] {
        let element = document.createElement(tagName);
        for (const [key, value] of Object.entries(attributes)) {
            if (value != null) {
                element.setAttribute(key, value.toString());
            }
        }
        element.innerText = text;
        children.forEach(child => {
            element.appendChild(child);
        });
        return element;
    }

    static appendChild<T extends HTMLElement, S extends HTMLElement>(parent: T, child : S) : S {
        parent.appendChild(child);
        return child;
    }
}