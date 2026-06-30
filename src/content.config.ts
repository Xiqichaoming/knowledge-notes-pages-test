import { defineCollection, z } from "astro:content";

const notes = defineCollection({
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.string(),
    categoryLabel: z.string(),
    tags: z.array(z.string()),
    updated: z.string(),
    source: z.string(),
    draft: z.boolean().default(false)
  })
});

export const collections = { notes };
