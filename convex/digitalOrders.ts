import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
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
  // In a real app, you'd check for an admin role.
  return userId;
};

export const create = mutation({
  args: {
    productId: v.id("products"),
    customerName: v.string(),
    customerPhone: v.string(),
    customerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ensureLoggedIn(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    return await ctx.db.insert("digitalOrders", {
      userId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail,
      productId: args.productId,
      productName: product.name,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    return await ctx.db.query("digitalOrders").withIndex("by_created_at").order("desc").paginate(args.paginationOpts);
  },
});

export const updateStatus = mutation({
  args: {
    orderId: v.id("digitalOrders"),
    status: v.union(v.literal("pending"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, { status: args.status });

    if (args.status === "completed") {
      await ctx.scheduler.runAfter(0, internal.email.sendDigitalCode, {
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        productName: order.productName,
      });
    }
  },
});
