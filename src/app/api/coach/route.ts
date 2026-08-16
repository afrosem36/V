import { NextResponse } from "next/server";
import { callGroq, type GroqMessage } from "@/lib/groq/server";

export const runtime = "nodejs";

interface FeedbackExercise {
  name: string;
  action: string;
  targetRepMin: number;
  targetRepMax: number;
  sets: { weight: number; reps: number; rir: number | null }[];
}

interface RecentSessionInput {
  date: string;
  label: string;
  primaryMuscles: string[];
  totalVolume: number;
  durationMin: number;
}

type CoachRequest =
  | { type: "feedback"; workoutLabel: string; exercises: FeedbackExercise[] }
  | { type: "explain"; exerciseName: string; primaryMuscle: string; equipment: string[] }
  | { type: "adjust"; exerciseName: string; primaryMuscle: string; availableEquipment: string[]; discomfortNote: string }
  | { type: "notes"; rawNote: string; exerciseNames: string[] }
  | { type: "nutrition"; recentSessions: RecentSessionInput[] };

const COMMON_SYSTEM =
  "You are a terse, practical strength-training coach embedded in a gym-logging app for someone rebuilding a V-shaped physique after a 9-10 month break. " +
  "Never diagnose injuries or give medical advice — if pain/discomfort comes up, suggest movement alternatives and recommend seeing a qualified professional. " +
  "No fluff, no exclamation-heavy hype, no repeating numbers the user can already see on screen. Plain text, no markdown.";

function buildMessages(body: CoachRequest): { messages: GroqMessage[]; maxTokens: number } {
  switch (body.type) {
    case "feedback": {
      const lines = body.exercises
        .map((e) => {
          const setsDesc = e.sets.map((s) => `${s.weight}kg x ${s.reps}${s.rir != null ? ` (RIR ${s.rir})` : ""}`).join(", ");
          return `- ${e.name}: target ${e.targetRepMin}-${e.targetRepMax} reps, next-time guidance "${e.action}". Sets: ${setsDesc}`;
        })
        .join("\n");
      return {
        maxTokens: 180,
        messages: [
          { role: "system", content: COMMON_SYSTEM },
          {
            role: "user",
            content: `Session "${body.workoutLabel}" just finished. Give a 2-4 sentence practical summary of how it went and what to expect next session.\n\n${lines}`,
          },
        ],
      };
    }
    case "explain": {
      return {
        maxTokens: 180,
        messages: [
          { role: "system", content: COMMON_SYSTEM },
          {
            role: "user",
            content: `In under 100 words: explain "${body.exerciseName}" (primary muscle: ${body.primaryMuscle}, equipment: ${body.equipment.join(", ") || "bodyweight"}). Cover what it trains, basic technique, one common mistake, and one safety cue.`,
          },
        ],
      };
    }
    case "adjust": {
      return {
        maxTokens: 180,
        messages: [
          { role: "system", content: COMMON_SYSTEM },
          {
            role: "user",
            content: `The user reported discomfort during "${body.exerciseName}" (primary muscle: ${body.primaryMuscle}): "${body.discomfortNote}". Their gym has: ${body.availableEquipment.join(", ")}. Suggest 2-3 alternative exercises that avoid the likely aggravating movement, using only that equipment. Explicitly note you are not diagnosing anything and recommend seeing a professional if it persists.`,
          },
        ],
      };
    }
    case "notes": {
      return {
        maxTokens: 120,
        messages: [
          { role: "system", content: COMMON_SYSTEM },
          {
            role: "user",
            content: `Condense this training note into one or two tight sentences suitable for a workout log, covering: ${body.exerciseNames.join(", ")}. Don't invent details. Note: "${body.rawNote}"`,
          },
        ],
      };
    }
    case "nutrition": {
      const lines = body.recentSessions
        .map((s) => `- ${s.date}: ${s.label} (muscles: ${s.primaryMuscles.join(", ") || "unspecified"}, volume ${s.totalVolume}kg, ${s.durationMin} min)`)
        .join("\n");
      return {
        maxTokens: 200,
        messages: [
          { role: "system", content: COMMON_SYSTEM },
          {
            role: "user",
            content:
              `Based on this recent training (most recent first), suggest 3-4 practical whole-food recovery meal/snack ideas ` +
              `(protein sources, carbs to replenish glycogen, hydration) for the next few hours. This is general recovery guidance, ` +
              `not a diet plan or medical/nutrition prescription — say so briefly. No specific calorie or macro numbers, no supplements. Keep it under 100 words.\n\n${lines}`,
          },
        ],
      };
    }
  }
}

export async function POST(request: Request) {
  let body: CoachRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("type" in body)) {
    return NextResponse.json({ error: "Missing 'type'" }, { status: 400 });
  }

  try {
    const { messages, maxTokens } = buildMessages(body);
    const text = await callGroq(messages, maxTokens);
    return NextResponse.json({ text });
  } catch (err) {
    // Coaching is always optional — callers must treat any non-200 as "skip the AI content", never block on it.
    const message = err instanceof Error ? err.message : "Coach unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
