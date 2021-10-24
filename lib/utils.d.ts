import type { FontObjectV1, FontObjectV2 } from "./index";
declare type FontObject = FontObjectV1 | FontObjectV2;
export declare const orderObject: (unordered: FontObject) => FontObject;
export declare const weightListGen: (variants: string[]) => number[];
export {};
