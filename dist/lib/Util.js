"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createMethodDecorator(fn) {
    return fn;
}
exports.createMethodDecorator = createMethodDecorator;
function enumerable(value) {
    return createMethodDecorator((_target, _propertyKey, descriptor) => {
        if (descriptor)
            descriptor.enumerable = value;
    });
}
exports.enumerable = enumerable;
//# sourceMappingURL=Util.js.map