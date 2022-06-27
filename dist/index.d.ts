interface APIResponse {
    family: string;
    variants: string[];
    subsets: string[];
    version: string;
    lastModified: string;
    category: string;
}

declare const APIDirect: APIResponse[];
interface FontVariants {
    [weight: string]: {
        [style: string]: {
            [subset: string]: {
                url: {
                    woff2: string;
                    woff: string;
                    truetype?: string;
                    opentype?: string;
                };
            };
        };
    };
}

export { APIDirect, APIResponse, FontVariants };
