"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weightListGen = exports.orderObject = void 0;
// Alphabetically order the generated font object lists
const orderObject = (unordered) => {
    const ordered = {};
    const orderedKeys = Object.keys(unordered).sort();
    for (const key of orderedKeys) {
        ordered[key] = unordered[key];
    }
    return ordered;
};
exports.orderObject = orderObject;
// Convert APIResponse.variants into a weights number[]
const weightListGen = (variants) => {
    // Replace regular and italic with numeric values
    const replacedList = variants.map(variant => {
        if (variant === "regular" || variant === "italic") {
            return "400";
        }
        return variant;
    });
    // Remove variants like 700italic to become 700
    const cleanedList = replacedList.map(variant => variant.replace(/italic/g, ""));
    // Convert from string to number
    const numberList = cleanedList.map(variant => Number(variant));
    const numberListWithoutDuplicates = [...new Set(numberList)];
    return numberListWithoutDuplicates;
};
exports.weightListGen = weightListGen;
