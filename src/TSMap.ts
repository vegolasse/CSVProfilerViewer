export class TSMap<KeyType, ValueType> extends Map<KeyType, ValueType> {

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