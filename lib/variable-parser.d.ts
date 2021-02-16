export interface FontObjectVariable {
    [id: string]: {
        family: string;
        axes: {
            [axesType: string]: {
                default: string;
                min: string;
                max: string;
                step: string;
            };
        };
        variants: FontVariants;
    };
}
interface FontVariants {
    [type: string]: {
        [style: string]: {
            [subset: string]: string;
        };
    };
}
export {};
