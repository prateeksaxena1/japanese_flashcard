import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/auth";

import { loginSchema } from "@/lib/validations";
import getRedisClient from "@/lib/redis";

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting Check (Max 5 attempts per IP per 15 minutes)
    const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
    const redis = getRedisClient();
    
    if (redis) {
      try {
        const rateLimitKey = `rate_limit:login:${ip}`;
        const attempts = await redis.incr(rateLimitKey);
        
        if (attempts === 1) {
          await redis.expire(rateLimitKey, 15 * 60); // 15 minutes
        }
        
        if (attempts > 5) {
          return NextResponse.json(
            { error: "Too many login attempts. Please try again in 15 minutes." },
            { status: 429 }
          );
        }
      } catch (redisError) {
        console.warn("[Rate Limit Warning] Redis is offline, skipping rate limit check:", redisError);
      }
    }

    const body = await request.json();
    
    // 2. Input Validation via Zod
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { email, password } = result.data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // If successful, reset the rate limit for this IP
    if (redis) {
      try {
        await redis.del(`rate_limit:login:${ip}`);
      } catch (e) {}
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    // Generate tokens
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      accessToken,
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Login Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
