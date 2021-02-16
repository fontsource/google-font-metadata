export interface FontObjectv2 {
  [id: string]: {
    family: string;
    id: string;
    subsets: string[];
    weights: string[];
    styles: string[];
    unicodeRange: {
      [subset: string]: string;
    };
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
