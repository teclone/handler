import FieldDataNotFoundException from './Exceptions/FieldDataNotFoundException';
export default {

    set(target: object, prop: string | number | symbol, value: any) {
        return Reflect.set(target, prop, value);
    },

    get(target: object, prop) {
        if (prop in target) {
            return target[prop];
        }
        else {
            throw new FieldDataNotFoundException('no data found for the given field: ' + prop);
        }
    }
}