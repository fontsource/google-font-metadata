import { z } from "zod";

const fontVariantsSchema = z.record(
  // [weight: string]
  z.record(
    // [style: string]
    z.record(
      // [subset: string]
      z
        .object({
          url: z.object({
            woff2: z.string(),
            woff: z.string(),
            truetype: z.string().optional(),
            opentype: z.string().optional(),
          }),
        })
        .strict()
    )
  )
);

type FontVariants = z.infer<typeof fontVariantsSchema>;

const fontObjectV1Schema = z.record(
  // [id: string]
  z
    .object({
      family: z.string(),
      id: z.string(),
      subsets: z.array(z.string()),
      weights: z.array(z.number().int()),
      styles: z.array(z.string()),
      variants: fontVariantsSchema,
      defSubset: z.string(),
      lastModified: z.string(),
      version: z.string(),
      category: z.string(),
    })
    .strict()
);

type FontObjectV1 = z.infer<typeof fontObjectV1Schema>;

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
      z.string() // url
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

export { fontObjectV1Schema, fontObjectV2Schema, fontObjectVariableSchema };
export type {
  FontObjectV1,
  FontObjectV2,
  FontObjectVariable,
  FontObjectVariableDirect,
  FontVariants,
  FontVariantsVariable,
};
