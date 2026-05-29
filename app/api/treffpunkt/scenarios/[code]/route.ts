import { NextResponse } from "next/server";
import { findTreffpunktScenario } from "@/lib/treffpunkt-scenarios";

type ScenarioRouteProps = {
  params: Promise<{
    code: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: ScenarioRouteProps) {
  const { code } = await params;
  const scenario = findTreffpunktScenario(code);

  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
  }

  return NextResponse.json(scenario);
}
