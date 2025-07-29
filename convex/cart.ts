import { v } from "convex/values";
    import { query, mutation } from "./_generated/server";
    import { getAuthUserId } from "@convex-dev/auth/server";

    const ensureLoggedIn = async (ctx: any) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new Error("Not authenticated.");
      }
      return userId;
    };

    export const list = query({
      handler: async (ctx) => {
        const userId = await ensureLoggedIn(ctx);
        const cartItems = await ctx.db
          .query("cartItems")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();

        const itemsWithProducts = await Promise.all(
          cartItems.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            if (!product) {
              return null;
            }
            const imageUrl = product.imageId ? await ctx.storage.getUrl(product.imageId) : null;
            return {
              ...item,
              product: {
                ...product,
                imageUrl,
                isOutOfStock: product.stockQuantity !== undefined && product.stockQuantity <= 0,
              },
            };
          })
        );

        return itemsWithProducts.filter((item): item is NonNullable<typeof item> => Boolean(item));
      },
    });

    export const add = mutation({
      args: {
        productId: v.id("products"),
      },
      handler: async (ctx, args) => {
        const userId = await ensureLoggedIn(ctx);
        const product = await ctx.db.get(args.productId);
        if (!product) {
          throw new Error("Product not found");
        }
        if (product.stockQuantity !== undefined && product.stockQuantity <= 0) {
            throw new Error("المنتج غير متوفر حالياً");
        }

        const existingItem = await ctx.db
          .query("cartItems")
          .withIndex("by_user_and_product", (q) =>
            q.eq("userId", userId).eq("productId", args.productId)
          )
          .unique();

        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          if (product.stockQuantity !== undefined && newQuantity > product.stockQuantity) {
            throw new Error("لا يمكن إضافة كمية أكبر من المتوفر في المخزون");
          }
          await ctx.db.patch(existingItem._id, { quantity: newQuantity });
        } else {
          await ctx.db.insert("cartItems", {
            userId,
            productId: args.productId,
            quantity: 1,
          });
        }
      },
    });

    export const updateQuantity = mutation({
      args: {
        itemId: v.id("cartItems"),
        quantity: v.number(),
      },
      handler: async (ctx, args) => {
        const userId = await ensureLoggedIn(ctx);
        const cartItem = await ctx.db.get(args.itemId);

        if (!cartItem || cartItem.userId !== userId) {
          throw new Error("Cart item not found");
        }

        if (args.quantity <= 0) {
          await ctx.db.delete(args.itemId);
          return;
        }
        
        const product = await ctx.db.get(cartItem.productId);
        if (!product) {
            throw new Error("Product not found");
        }
        if (product.stockQuantity !== undefined && args.quantity > product.stockQuantity) {
            throw new Error("الكمية المطلوبة أكبر من المتوفر في المخزون");
        }

        await ctx.db.patch(args.itemId, { quantity: args.quantity });
      },
    });

    export const remove = mutation({
      args: {
        itemId: v.id("cartItems"),
      },
      handler: async (ctx, args) => {
        const userId = await ensureLoggedIn(ctx);
        const cartItem = await ctx.db.get(args.itemId);

        if (!cartItem || cartItem.userId !== userId) {
          throw new Error("Cart item not found");
        }

        await ctx.db.delete(args.itemId);
      },
    });
