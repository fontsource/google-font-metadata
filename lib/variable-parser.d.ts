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
        variants: FontVariantsVariable;
    };
}
export interface FontVariantsVariable {
    [type: string]: {
        [style: string]: {
            [subset: string]: string;
        };
    };
}
