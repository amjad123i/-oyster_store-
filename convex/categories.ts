import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

const DIGITAL_CODES_CATEGORY_NAME = "اكواد رقمية";

const ensureAdmin = async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated.");
  }
  // In a real app, you'd check for an admin role.
  return userId;
};

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("categories").withIndex("by_created_at").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByParent = query({
  args: { parentId: v.optional(v.union(v.id("categories"), v.null())) },
  handler: async (ctx, args) => {
    const parentId = args.parentId === null ? undefined : args.parentId;
    return await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parentId", parentId))
      .order("desc")
      .collect();
  },
});

export const getProductsByCategory = query({
    args: { 
        categoryId: v.id("categories"),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const productsResult = await ctx.db
            .query("products")
            .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
            .paginate(args.paginationOpts);
        
        const page = await Promise.all(
            productsResult.page.map(async (product) => {
                const imageUrl = product.imageId ? await ctx.storage.getUrl(product.imageId) : null;
                return {
                    ...product,
                    imageUrl,
                    isOutOfStock: product.stockQuantity !== undefined && product.stockQuantity <= 0,
                };
            })
        );

        return {
            ...productsResult,
            page,
        };
    }
});

export const create = mutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    if (args.name === DIGITAL_CODES_CATEGORY_NAME) {
        const existing = await ctx.db.query("categories").withIndex("by_name", q => q.eq("name", DIGITAL_CODES_CATEGORY_NAME)).first();
        if (existing) {
            throw new Error("فئة الأكواد الرقمية موجودة بالفعل.");
        }
    }
    return await ctx.db.insert("categories", {
      name: args.name,
      parentId: args.parentId,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    parentId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    const category = await ctx.db.get(args.id);
    if (category?.name === DIGITAL_CODES_CATEGORY_NAME) {
        throw new Error("لا يمكن تعديل فئة الأكواد الرقمية المحمية.");
    }
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new Error("Category not found");
    }
    if (category.name === DIGITAL_CODES_CATEGORY_NAME) {
        throw new Error("لا يمكن حذف فئة الأكواد الرقمية المحمية.");
    }

    const children = await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .collect();
    for (const child of children) {
      await ctx.db.patch(child._id, { parentId: undefined });
    }

    const products = await ctx.db.query("products").withIndex("by_category", q => q.eq("categoryId", args.id)).collect();
    for (const product of products) {
        await ctx.db.patch(product._id, { categoryId: undefined });
    }

    await ctx.db.delete(args.id);
  },
});

export const seedDigitalCodeCategory = mutation({
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        const existing = await ctx.db.query("categories").withIndex("by_name", q => q.eq("name", DIGITAL_CODES_CATEGORY_NAME)).first();
        if (existing) {
            throw new Error("فئة 'اكواد رقمية' موجودة بالفعل.");
        }
        await ctx.db.insert("categories", {
            name: DIGITAL_CODES_CATEGORY_NAME,
            createdAt: Date.now(),
        });
    }
});
