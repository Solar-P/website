import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const projects = defineCollection({ loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }), schema: z.object({
  title: z.string(), subtitle: z.string(), summary: z.string(), category: z.string(), year: z.number().optional(),
  coverImage: z.string().optional(), coverAlt: z.string().default(''), gallery: z.array(z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() })).optional(),
  media: z.array(z.object({ type: z.enum(['image','video']), src: z.string(), alt: z.string(), caption: z.string().optional(), poster: z.string().optional() })).optional(),
  technologies: z.array(z.string()).default([]), featured: z.boolean().default(false), order: z.number().default(0),
  liveUrl: z.url().optional(), repositoryUrl: z.url().optional(), role: z.string().optional(), region: z.string().optional(), dataSources: z.array(z.string()).optional(),
  draft: z.boolean().default(true), seoDescription: z.string().optional()
}) });
export const collections = { projects };
