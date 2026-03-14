import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json({ error: "classId 필요" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
    }

    const { error } = await supabase.from("notification_requests").upsert(
      { user_id: user.id, class_id: classId },
      { onConflict: "user_id,class_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
