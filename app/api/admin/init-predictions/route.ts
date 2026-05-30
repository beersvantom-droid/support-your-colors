import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    // Simple auth check
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = makeServiceClient();

    // Create match_results table if it doesn't exist
    const { error: createError } = await db.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS match_results (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          external_id TEXT NOT NULL UNIQUE,
          home_team TEXT NOT NULL,
          away_team TEXT NOT NULL,
          match_date DATE NOT NULL,
          home_score INT,
          away_score INT,
          status TEXT NOT NULL DEFAULT 'upcoming',
          winner TEXT,
          processed BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

        CREATE POLICY IF NOT EXISTS "public read match_results"
          ON match_results FOR SELECT USING (true);
      `,
    });

    if (createError) {
      // Try raw SQL request instead
      console.log("Trying raw SQL request...");
      return NextResponse.json({
        error: "Could not create table via RPC",
        hint: "Try creating the table manually in Supabase SQL editor",
      });
    }

    return NextResponse.json({
      success: true,
      message: "match_results table created successfully",
    });
  } catch (err) {
    console.error("[init-predictions] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
