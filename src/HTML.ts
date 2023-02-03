export class HTML {

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