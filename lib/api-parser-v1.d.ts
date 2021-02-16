export interface FontObjectv1 {
    [id: string]: {
        family: string;
        id: string;
        subsets: string[];
        weights: string[];
        styles: string[];
        variants: FontVariants;
        defSubset: string;
        lastModified: string;
        version: string;
        category: string;
    };
}
interface FontVariants {
    [weight: string]: {
        [style: string]: {
            [subset: string]: {
                local: string[];
                url: {
                    [type: string]: string;
                };
            };
        };
    };
}
export {};
