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

interface FontObjectV1 {
  [id: string]: {
    family: string;
    id: string;
    subsets: string[];
    weights: number[];
    styles: string[];
    variants: FontVariants;
    defSubset: string;
    lastModified: string;
    version: string;
    category: string;
  };
}

interface FontObjectV2 {
  [id: string]: {
    family: string;
    id: string;
    subsets: string[];
    weights: number[];
    styles: string[];
    unicodeRange: { [subset: string]: string };
    variants: FontVariants;
    defSubset: string;
    lastModified: string;
    version: string;
    category: string;
  };
}

// Variable
interface FontObjectVariableDirect {
  family: string;
  id: string;
  axes: {
    [axes: string]: {
      default: string;
      min: string;
      max: string;
      step: string;
    };
  };
}

interface FontVariantsVariable {
  [type: string]: {
    [style: string]: {
      [subset: string]: string;
    };
  };
}

interface FontObjectVariable {
  [id: string]: FontObjectVariableDirect & {
    variants: FontVariantsVariable;
  };
}

type FontObject = FontObjectV1 | FontObjectV2 | FontObjectVariable;

export type {
  FontObject,
  FontObjectV1,
  FontObjectV2,
  FontObjectVariable,
  FontObjectVariableDirect,
  FontVariants,
  FontVariantsVariable,
};
