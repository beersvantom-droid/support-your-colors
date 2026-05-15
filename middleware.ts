import { NextResponse, type NextRequest } from "next/server";
import { proxy, config as proxyConfig } from "@/proxy";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/process-commentary")) {
    return NextResponse.next();
  }
  return proxy(request);
}

export const config = proxyConfig;
