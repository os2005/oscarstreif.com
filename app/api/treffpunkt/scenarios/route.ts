import { NextResponse } from "next/server";
import { createTreffpunktScenario } from "@/lib/treffpunkt-scenarios";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid scenario payload." }, { status: 400 });
    }

    const scenario = createTreffpunktScenario(body);
    return NextResponse.json(scenario);
  } catch {
    return NextResponse.json({ error: "Scenario could not be saved." }, { status: 400 });
  }
}
