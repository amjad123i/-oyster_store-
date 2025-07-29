import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  categories: defineTable({
    name: v.string(),
    parentId: v.optional(v.id("categories")),
    createdAt: v.number(),
  })
    .index("by_parent", ["parentId"])
    .index("by_name", ["name"])
    .index("by_created_at", ["createdAt"]),

  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    imageId: v.optional(v.id("_storage")),
    categoryId: v.optional(v.id("categories")),
    stockQuantity: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_category", ["categoryId"])
    .index("by_stock", ["stockQuantity"])
    .searchIndex("search_name", {
      searchField: "name",
    })
    .index("by_created_at", ["createdAt"]),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_product", ["userId", "productId"]),

  orders: defineTable({
    userId: v.id("users"),
    customerName: v.string(),
    userName: v.optional(v.string()),
    customerPhone: v.string(),
    customerAddress: v.string(),
    notes: v.optional(v.string()),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      price: v.number(),
      quantity: v.number(),
      imageId: v.optional(v.id("_storage")),
    })),
    subtotal: v.number(),
    shippingLocation: v.union(v.literal("baghdad"), v.literal("provinces")),
    shippingFee: v.number(),
    totalAmount: v.number(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    createdAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),
    
  digitalOrders: defineTable({
    userId: v.id("users"),
    customerName: v.string(),
    customerPhone: v.string(),
    customerEmail: v.string(),
    productId: v.id("products"),
    productName: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed")),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
