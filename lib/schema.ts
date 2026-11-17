import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Dato må være YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Ugyldig dato");

export const WishSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id kan bare inneholde a-z, 0-9 og -"),
  name: z.string().min(1),
  note: z.string().optional(),
  hand: z.string().optional(),
  multi: z.boolean().optional(),
  star: z.boolean().optional(),
  links: z
    .array(
      z.object({
        label: z.string().min(1),
        url: z.url({ protocol: /^https?$/ }),
      }),
    )
    .optional(),
  sale: z
    .object({ price: z.string().min(1), was: z.string().min(1), until: isoDate })
    .optional(),
});

export const CategorySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  icon: z.enum(["run", "kitchen", "tech", "music", "travel"]),
  items: z.array(WishSchema).min(1),
});

export const WishListSchema = z
  .object({
    occasion: z.string().min(1),
    sizes: z.record(z.string(), z.string()),
    categories: z.array(CategorySchema).min(1),
  })
  .superRefine((list, ctx) => {
    const ids = new Set<string>();
    const slugs = new Set<string>();
    for (const cat of list.categories) {
      if (slugs.has(cat.slug)) {
        ctx.addIssue({ code: "custom", message: `Duplisert slug: ${cat.slug}` });
      }
      slugs.add(cat.slug);
      for (const item of cat.items) {
        if (ids.has(item.id)) {
          ctx.addIssue({ code: "custom", message: `Duplisert id: ${item.id}` });
        }
        ids.add(item.id);
      }
    }
  });

export type Wish = z.infer<typeof WishSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type WishList = z.infer<typeof WishListSchema>;

export function findWishIn(list: WishList, id: string): Wish | undefined {
  for (const c of list.categories) {
    const hit = c.items.find((it) => it.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function findCategoryIn(list: WishList, slug: string): Category | undefined {
  return list.categories.find((c) => c.slug === slug);
}
