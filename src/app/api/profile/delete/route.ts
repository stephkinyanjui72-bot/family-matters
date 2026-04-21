import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// Delete the authenticated user's account. Cascades to profiles (FK) and
// to any rooms/players they own (host_user_id / user_id FK with ON DELETE
// SET NULL for players and CASCADE for profiles). The rooms themselves
// remain reachable by their code until they expire normally.
//
// Body-less. Requires the caller's Bearer access token so we can resolve
// which user to delete.
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return NextResponse.json({ ok: false, error: "Sign in to delete account" }, { status: 401 });

  const sb = getAdminSupabase();
  const { data: userRes, error: userErr } = await sb.auth.getUser(token);
  const user = userRes?.user;
  if (userErr || !user) return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });

  // Delete auth user (cascade removes profile via FK).
  const { error } = await sb.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
