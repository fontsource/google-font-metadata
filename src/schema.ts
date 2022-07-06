import colors from "picocolors"
import { z, ZodError } from "zod";

import type { FontObject } from "./index";

export class ValidationError extends Error {
  constructor(message: string | ZodError, version: "v1" | "v2" | "variable") {
    const shell = `Invalid parse for ${version}! Try running ${colors.yellow(
      version !== "variable" ? "npx gfm parse -f" : "npx gfm generate --variable && npx gfm parse --variable"
    )}. If the problem still persists, Google may have tweaked their API. Please make an issue on google-font-metadata.\n`
    super(shell + message)
    this.name = "ValidationError"
  }
}

/* Using z.record is really bad for validation since it isn't strict enough, so we split this all up into many smaller obj schemas with custom record validators */

// Refactoring this to @deepkit/type when it stablises in the future will hugely reduce complexity
const variantSubsetObj = z
  .object({
    url: z.object({
      woff2: z.string().url().min(1),
      woff: z.string().url().min(1),
      truetype: z.string().url().min(1).optional(),
      opentype: z.string().url().min(1).optional(),
    }),
  })
  .strict()

// [weight: string]
const fontVariantsSchema = z.record(
  // [style: string]
  z.record(
    // [subset: string]
    z.record(
      variantSubsetObj
    )
  )
);

type FontVariants = z.infer<typeof fontVariantsSchema>;

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

const fontObjectV1Schema = z
  .object({
    family: z.string().min(1),
    id: z.string().min(1),
    subsets: z.array(z.string().min(1)).min(1),
    weights: z.array(z.number().int()).min(1),
    styles: z.array(z.string().min(1)).min(1),
    variants: fontVariantsSchema,
    defSubset: z.string().min(1),
    lastModified: z.string().min(1),
    version: z.string().min(1),
    category: z.string().min(1),
  })
  .strict()

interface FontObjDirect {
  family: string,
}

const checkKeys = (dataId: FontObjDirect, keys: string[], type = "") => {
  if (keys.length === 0)
    throw new ValidationError(`No ${type} variants found for ${dataId.family}\nData: ${dataId}`, "v1")
}

const fontObjectV1Validate = (data: FontObject) => {
  const dataKeys = Object.keys(data);
  console.log(dataKeys);
  if (dataKeys.length === 0)
    throw new ValidationError(`Empty APIv1 Object!\nData: ${data}`, "v1")

  // Iterate over [id: string]
  for (const id of dataKeys) {
    const dataId = data[id];
    const valid = fontObjectV1Schema.safeParse(dataId);
    if (!valid.success)
      throw new ValidationError(valid.error, "v1");

    // Variants still use z.record, so we have to iterate over each with a strict obj schema
    // Refer to google-fonts-v1.json to understand iterable keys
    const variantKeys = Object.keys(dataId.variants)
    checkKeys(dataId, variantKeys);

    for (const weight of variantKeys) {
      const weightKeys = Object.keys(dataId.variants[weight]);
      checkKeys(dataId, weightKeys, "weight")

      for (const style of weightKeys) {
        const styleKeys = Object.keys(dataId.variants[weight][style]);
        checkKeys(dataId, styleKeys, "style")

        for (const subset of styleKeys) {
          const obj = dataId.variants[weight][style][subset];
          checkKeys(dataId, Object.keys(obj), "subset")

          const validSubset = variantSubsetObj.safeParse(dataId.variants[weight][style][subset])
          if (!validSubset.success)
            throw new ValidationError(validSubset.error, "v1")
        }
      }
    }
  }
}




const fontObjectV2Schema = z.record(
  // [id: string]
  z
    .object({
      family: z.string(),
      id: z.string(),
      subsets: z.array(z.string()),
      weights: z.array(z.number().int()),
      styles: z.array(z.string()),
      unicodeRange: z.record(z.string()),
      variants: fontVariantsSchema,
      defSubset: z.string(),
      lastModified: z.string(),
      version: z.string(),
      category: z.string(),
    })
    .strict()
);

type FontObjectV2 = z.infer<typeof fontObjectV2Schema>;

const fontVariantsVariableSchema = z.record(
  // [type: string]
  z.record(
    // [style: string]
    z.record(
      // [subset: string]
      z.string().url() // url
    )
  )
);

type FontVariantsVariable = z.infer<typeof fontVariantsVariableSchema>;

const fontObjectVariableDirectSchema = z.record(
  // [id: string]
  z.object({
    family: z.string(),
    axes: z.record(
      // axesType: string
      z
        .object({
          default: z.string(),
          min: z.string(),
          max: z.string(),
          step: z.string(),
        })
        .strict()
    ),
  })
);

const fontObjectVariableSchema = z.record(
  // [id: string]
  z.object({
    family: z.string(),
    axes: z.record(
      // axesType: string
      z
        .object({
          default: z.string(),
          min: z.string(),
          max: z.string(),
          step: z.string(),
        })
        .strict()
    ),
    variants: fontVariantsVariableSchema,
  })
);

type FontObjectVariable = z.infer<typeof fontObjectVariableSchema>;
type FontObjectVariableDirect = z.infer<typeof fontObjectVariableDirectSchema>;

export { fontObjectV1Schema, fontObjectV1Validate, fontObjectV2Schema, fontObjectVariableSchema };
export type {
  FontObjectV1,
  FontObjectV2,
  FontObjectVariable,
  FontObjectVariableDirect,
  FontVariants,
  FontVariantsVariable,
};
