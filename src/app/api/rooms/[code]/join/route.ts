import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";
import { clampName, newPid } from "../../../_lib/roomHelpers";

export const dynamic = "force-dynamic";

// Join an existing room as a new player. Body: { name }.
// Optional Bearer token is honoured: authed users get their auth user_id
// recorded on the player row, and under-18 accounts are blocked from
// joining adult-tier rooms entirely.
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const name = clampName(body.name, "Player");

  const sb = getAdminSupabase();
  const { data: room } = await sb
    .from("rooms")
    .select("code, intensity")
    .eq("code", code)
    .maybeSingle();
  if (!room) return NextResponse.json({ ok: false, error: "Room not found" }, { status: 404 });

  // Resolve authed user (if any) from Bearer token.
  let userId: string | null = null;
  let isTeen = false;
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token) {
    const { data: userRes } = await sb.auth.getUser(token);
    if (userRes?.user?.id) {
      userId = userRes.user.id;
      const { data: profile } = await sb.from("profiles").select("birthdate").eq("id", userId).maybeSingle();
      const dob = (profile as { birthdate?: string | null } | null)?.birthdate ?? null;
      if (dob) {
        const d = new Date(dob);
        const now = new Date();
        let age = now.getFullYear() - d.getFullYear();
        const m = now.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
        isTeen = age >= 0 && age < 18;
      }
    }
  }

  // Teens can't join Extreme/Chaos rooms at all.
  const intensity = (room as { intensity?: string } | null)?.intensity;
  if (isTeen && (intensity === "extreme" || intensity === "chaos")) {
    return NextResponse.json(
      { ok: false, error: "This party isn't available for teen accounts" },
      { status: 403 },
    );
  }

  const { count } = await sb
    .from("room_players")
    .select("pid", { count: "exact", head: true })
    .eq("room_code", code);
  if ((count ?? 0) >= 20) return NextResponse.json({ ok: false, error: "Room is full" }, { status: 403 });

  const pid = newPid();
  const { error } = await sb.from("room_players").insert({
    room_code: code, pid, user_id: userId, name, is_host: false, online: true,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, code, pid });
}
