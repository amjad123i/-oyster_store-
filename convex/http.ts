import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { httpRouter } from "convex/server";

const http = httpRouter();

// 🔒 إضافة الراوتر الخاص بالمصادقة (auth)
auth.addHttpRoutes(http);


export default http;
