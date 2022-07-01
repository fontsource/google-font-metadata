import { z } from "zod";

const fontVariantsSchema = z.record(
    z.record(
        z.record(
            z.object({
                url: z.object({
                    woff2: z.string(),
                    woff: z.string(),
                    truetype: z.string().optional(),
                    opentype: z.string().optional(),
                }),
            }).strict()
        )
    )
);

type FontVariants = z.infer<typeof fontVariantsSchema>

const fontObjectV1Schema = z.record(z.object({
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
}).strict())

type FontObjectV1 = z.infer<typeof fontObjectV1Schema>

const fontObjectV2Schema = z.record(z.object({
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
}).strict())

type FontObjectV2 = z.infer<typeof fontObjectV2Schema>

export { fontObjectV1Schema, fontObjectV2Schema, fontVariantsSchema }
export type { FontObjectV1, FontObjectV2, FontVariants }