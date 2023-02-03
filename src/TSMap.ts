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


/**
 * A slight improvement of the javascript Map class that makes it easier to use with typescript.
 */
export class TSMap<KeyType, ValueType> extends Map<KeyType, ValueType> {

    /**
     * A convenience method to get the value if it exists or otherwise compute it and put it in the Map.
     * This way a value will always be returned and there's no need to handle "undefined" in Typescript!
     * @param {KeyType} key The key to get the value for in the map
     * @param {(key: KeyType) => ValueType} mappingFunction a function that generates the value if it's missing. Will only be called when there is no value.
     * @returns {ValueType} The stored value if there was one, or the value generated by the function.
     */
    computeIfAbsent(key : KeyType, mappingFunction : (key : KeyType) => ValueType ) : ValueType {
        if (this.has(key)) {
            // @ts-ignore
            return this.get(key);
        }
        let computedValue = mappingFunction(key);
        this.set(key, computedValue);
        return computedValue;
    }

}