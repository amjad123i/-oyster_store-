"use node";
import { internalAction } from "./_generated/server";
import { Resend } from "resend";
import { v } from "convex/values";

export const sendDigitalCode = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    productName: v.string(),
  },
  handler: async (ctx, { customerEmail, customerName, productName }) => {
    const resend = new Resend(process.env.CONVEX_RESEND_API_KEY);
    
    // In a real app, you would fetch the actual digital code from your database
    // associated with the product. For now, we'll use a placeholder.
    const digitalCode = "YOUR-UNIQUE-DIGITAL-CODE-HERE";

    const { data, error } = await resend.emails.send({
      from: "Oyster Store <noreply@oyster-store.convex.site>",
      to: [customerEmail],
      subject: `طلبك للمنتج الرقمي: ${productName}`,
      html: `
        <h1>مرحباً ${customerName},</h1>
        <p>شكراً لطلبك المنتج: <strong>${productName}</strong>.</p>
        <p>هذا هو الكود الرقمي الخاص بك:</p>
        <h2 style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">${digitalCode}</h2>
        <p>شكراً لتسوقك معنا!</p>
      `,
    });

    if (error) {
      console.error("Failed to send email:", error);
      // Consider using the action retrier component for more robust error handling
      throw new Error("Failed to send email");
    }

    console.log("Email sent successfully:", data);
    return data;
  },
});
