import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

const ensureAdmin = async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated.");
  }
  // In a real app, you'd check for an admin role.
  return userId;
};

export const list = query({
  args: {
    search: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let productQuery;
    if (args.search && args.search.length > 0) {
      productQuery = ctx.db
        .query("products")
        .withSearchIndex("search_name", (q) => q.search("name", args.search!));
    } else {
      productQuery = ctx.db.query("products").withIndex("by_created_at").order("desc");
    }
    
    const products = await productQuery.paginate(args.paginationOpts);

    const page = await Promise.all(
      products.page.map(async (product) => {
        const imageUrl = product.imageId ? await ctx.storage.getUrl(product.imageId) : null;
        const category = product.categoryId ? await ctx.db.get(product.categoryId) : null;
        return {
          ...product,
          imageUrl,
          categoryName: category?.name,
          isOutOfStock: product.stockQuantity !== undefined && product.stockQuantity <= 0,
        };
      })
    );

    return {
      ...products,
      page,
    };
  },
});

export const get = query({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.id);
        if (!product) {
            return null;
        }
        const imageUrl = product.imageId ? await ctx.storage.getUrl(product.imageId) : null;
        const category = product.categoryId ? await ctx.db.get(product.categoryId) : null;
        return {
            ...product,
            imageUrl,
            categoryName: category?.name,
            isOutOfStock: product.stockQuantity !== undefined && product.stockQuantity <= 0,
        };
    }
});

export const generateUploadUrl = mutation(async (ctx) => {
  await ensureAdmin(ctx);
  return await ctx.storage.generateUploadUrl();
});

export const create = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        price: v.number(),
        stockQuantity: v.number(),
        categoryId: v.id("categories"),
        imageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        return await ctx.db.insert("products", {
            ...args,
            createdAt: Date.now(),
        });
    }
});

export const update = mutation({
    args: {
        id: v.id("products"),
        name: v.string(),
        description: v.string(),
        price: v.number(),
        stockQuantity: v.number(),
        categoryId: v.id("categories"),
        imageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
    }
});

export const updateStock = mutation({
    args: {
        id: v.id("products"),
        stockQuantity: v.number(),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        await ctx.db.patch(args.id, { stockQuantity: args.stockQuantity });
    }
});

export const remove = mutation({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const product = await ctx.db.get(args.id);
        if (product?.imageId) {
            await ctx.storage.delete(product.imageId);
        }
        await ctx.db.delete(args.id);
    }
});
