import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

const ensureLoggedIn = async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated.");
  }
  return userId;
};

const ensureAdmin = async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated.");
  }
  // NOTE: This doesn't check for a specific admin role.
  // In a real app, you'd want to verify the user is an admin.
  return userId;
};

export const create = mutation({
  args: {
    customerName: v.string(),
    customerPhone: v.string(),
    customerAddress: v.string(),
    notes: v.optional(v.string()),
    shippingLocation: v.union(v.literal("baghdad"), v.literal("provinces")),
  },
  handler: async (ctx, args) => {
    const userId = await ensureLoggedIn(ctx);
    const user = await ctx.db.get(userId);
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (cartItems.length === 0) {
      throw new Error("السلة فارغة");
    }

    let subtotal = 0;
    const orderItems = [];
    for (const item of cartItems) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        await ctx.db.delete(item._id);
        throw new Error("تمت إزالة منتج لم يعد متوفرًا من سلتك. يرجى مراجعة طلبك والمحاولة مرة أخرى.");
      }
      if (product.stockQuantity !== undefined && product.stockQuantity < item.quantity) {
        throw new Error(`الكمية المطلوبة للمنتج "${product.name}" غير متوفرة في المخزون.`);
      }
      
      if (product.stockQuantity !== undefined) {
          await ctx.db.patch(product._id, { stockQuantity: product.stockQuantity - item.quantity });
      }

      subtotal += product.price * item.quantity;
      orderItems.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        imageId: product.imageId,
      });
    }

    const shippingFee = args.shippingLocation === "baghdad" ? 5000 : 10000;
    const totalAmount = subtotal + shippingFee;

    const orderId = await ctx.db.insert("orders", {
      userId,
      userName: user?.name,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerAddress: args.customerAddress,
      notes: args.notes,
      shippingLocation: args.shippingLocation,
      items: orderItems,
      subtotal,
      shippingFee,
      totalAmount,
      status: "pending",
      createdAt: Date.now(),
    });

    await Promise.all(cartItems.map((item) => ctx.db.delete(item._id)));

    return orderId;
  },
});

export const listMyOrders = query({
    handler: async (ctx) => {
        const userId = await ensureLoggedIn(ctx);
        return await ctx.db.query("orders").withIndex("by_user", q => q.eq("userId", userId)).order("desc").collect();
    }
});

export const listAllOrders = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    const ordersResult = await ctx.db.query("orders").withIndex("by_created_at").order("desc").paginate(args.paginationOpts);

    const page = await Promise.all(
      ordersResult.page.map(async (order) => {
        const itemsWithUrls = await Promise.all(
          order.items.map(async (item) => {
            const imageUrl = item.imageId ? await ctx.storage.getUrl(item.imageId) : null;
            return { ...item, imageUrl };
          })
        );
        return { ...order, items: itemsWithUrls, userName: order.userName ?? "مستخدم محذوف" };
      })
    );

    return {
      ...ordersResult,
      page,
    };
  },
});

export const updateStatus = mutation({
    args: {
        orderId: v.id("orders"),
        status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    },
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        const order = await ctx.db.get(args.orderId);
        if (!order) {
            throw new Error("الطلب غير موجود");
        }

        const oldStatus = order.status;
        const newStatus = args.status;

        if (oldStatus === newStatus) {
            return;
        }

        if (newStatus === 'rejected' && oldStatus !== 'rejected') {
            for (const item of order.items) {
                const product = await ctx.db.get(item.productId);
                if (product && product.stockQuantity !== undefined) {
                    await ctx.db.patch(item.productId, { stockQuantity: product.stockQuantity + item.quantity });
                }
            }
        } 
        else if (oldStatus === 'rejected' && newStatus !== 'rejected') {
            for (const item of order.items) {
                const product = await ctx.db.get(item.productId);
                if (product && product.stockQuantity !== undefined) {
                    if (product.stockQuantity < item.quantity) {
                        throw new Error(`لا يوجد مخزون كافٍ للمنتج ${product.name} لإعادة الطلب.`);
                    }
                    await ctx.db.patch(item.productId, { stockQuantity: product.stockQuantity - item.quantity });
                }
            }
        }

        await ctx.db.patch(args.orderId, { status: newStatus });
    }
});
