import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { FanPersonality } from "@/lib/supabase";
import { type ToneCategory, detectTone } from "@/lib/commentators";

// ─── Dutch comment templates per personality × tone ───────────────────────────

const TEMPLATES: Record<FanPersonality, Partial<Record<ToneCategory, string[]>>> & Record<FanPersonality, { _default: string[] }> = {
  sarcastic: {
    _default:         ["Wow heel spannend 😐", "Diep onder de indruk hoor", "Wat een post zeg", "Bijzonder, echt"],
    neutral:          ["Wow heel spannend 😐", "Diep onder de indruk hoor", "Wat een post zeg", "Bijzonder, echt"],
    high_confidence:  ["Ja ja we zien het nog wel 😂", "Die zelfverzekerdheid...", "Succes met die verwachtingen", "Kalm aan een beetje"],
    celebration:      ["Rustig aan toch", "Het is één goal hoor", "Zo blij om één reden 🙄", "Beetje overdreven?"],
    doubt:            ["Eindelijk eerlijk", "Tja, realistisch 👏", "Herkenbaar ja", "Nee het gaat ook echt niks worden"],
    trash_talk:       ["Oef dat is pittig 😬", "Rustig rustiger", "Agressief vandaag", "Okaaay"],
    cryptic:          ["…ok?", "Wat probeer je te zeggen", "Diep 🙄", "Interessant"],
    derby:            ["Oh het is alweer derby-energie hier", "Elke keer hetzelfde circus 🙄", "Kalm blijven mensen"],
    night_chaos:      ["Midden in de nacht dit posten 🙄", "Ga slapen", "Serieus?"],
  },
  hype: {
    _default:         ["LEKKER BEZIG 🔥", "Kom op jongens!!!", "Wij gaan dit!!", "Laten we gaan 🙌"],
    neutral:          ["LEKKER BEZIG 🔥", "Kom op jongens!!!", "Wij gaan dit!!", "Laten we gaan 🙌"],
    high_confidence:  ["DAT IS DE SPIRIT 💪", "100% GELOOF", "DIT IS ONS JAAR 🔥", "NIEMAND STOPT ONS"],
    celebration:      ["YESSSS 🎉🔥", "GAAN WE!!!", "NIET TE GELOVEN HOE GOED", "BRAAAAP 🔥🔥🔥"],
    doubt:            ["HEB VERTROUWEN 💪", "WE GELOVEN ERIN ALTIJD", "NIET OPGEVEN!!!", "HUP HUP HUP"],
    trash_talk:       ["OKE MAAR WIJ ZIJN BETER 🔥", "LAAT ZE MAAR PRATEN", "WIJ LACHEN STRAKS 💪", "VERTROUWEN!!!"],
    cryptic:          ["WAT DAN OOK WIJ STAAN ACHTER JE 🔥", "DE ENERGIE IS GOED", "POSITIEF ALTIJD 💪"],
    derby:            ["DERBY TIJD 🔥🔥🔥", "DIT IS HET MOMENT 💪", "IEDEREEN KLAAR???", "NU OF NOOIT 🔥"],
    night_chaos:      ["NACHT SESSIE 🌙🔥", "SLAAP KAN WACHTEN", "LATE NIGHT VOETBAL GANG 🔥"],
  },
  toxic: {
    _default:         ["Typisch 🙄", "Zeg maar niks", "Ja hoor", "Oké dan"],
    neutral:          ["Typisch 🙄", "Zeg maar niks", "Ja hoor", "Oké dan"],
    high_confidence:  ["Lol nee", "Droom lekker verder", "Hahaha ok vriend", "Gaat hem echt niet worden"],
    celebration:      ["Feest voor niks", "Wacht maar", "Één keer en al compleet gek", "Zo makkelijk blij te maken"],
    doubt:            ["Zie je wel", "Zei ik toch", "Eindelijk door", "Had ik al gezegd"],
    trash_talk:       ["Precies dit ja", "100% mee eens", "Eindelijk iemand die het snapt", "Wist ik al lang"],
    cryptic:          ["Oke 🙄", "Whatever", "Mwah", "Boeit me niet"],
    derby:            ["Elke derby hetzelfde gezeik", "Hou je mond gewoon", "Al zat van dit drama"],
    night_chaos:      ["Slapeloze nacht door voetbal, top", "Typisch", "Kan het niet laten"],
  },
  funny: {
    _default:         ["Hoe dan 😂", "Bruh", "Ik lach echt 💀", "Niet te geloven"],
    neutral:          ["Hoe dan 😂", "Bruh", "Ik lach echt 💀", "Niet te geloven"],
    high_confidence:  ["Grote woorden 😂", "Bro denkt dat hij bondscoach is", "Ja houdoe 😂", "Haha ok Mourinho"],
    celebration:      ["KIJK NAAR HEM GAAN 🤣", "Hij doet het echt haha", "Rust rustig 😂", "Is ie altijd zo?"],
    doubt:            ["Zelfde energie als ik voor een toets 😂", "Broeder van mij 😭", "Dit tweet ik op als ze winnen 😂", "SAMENGEVAT"],
    trash_talk:       ["Bro is BOOS 😂💀", "Rustig aan 😭", "Ik ga even weg 😂", "Hij zit er echt niet over in"],
    cryptic:          ["Wat 😭", "Ik snap er niks van maar ik lach", "OK??", "Bro??? 😂"],
    derby:            ["Altijd die derby-energie bij deze mensen 🤣", "Elk jaar hetzelfde theater 😂", "Ik lach elke keer"],
    night_chaos:      ["Het is midden in de nacht bro 😂", "Slapen wij niet?", "Late night banger 😂"],
  },
  tactical: {
    _default:         ["Interessant perspectief", "De balans klopt gewoon niet", "Qua formatie snap ik het wel", "De pressing was inderdaad zwak"],
    neutral:          ["Interessant perspectief", "De balans klopt gewoon niet", "Qua formatie snap ik het wel", "De pressing was inderdaad zwak"],
    high_confidence:  ["Als het middenveld staat ja", "De verdediging is het echte probleem", "Dat hangt van de opstelling af", "Klinkt goed maar de xG liegt niet"],
    celebration:      ["Resultaat goed maar het spel moet beter", "Drie punten is drie punten", "Qua efficiëntie ja, qua spel minder", "Gelukkig gewonnen, tweede helft was zwak"],
    doubt:            ["Begrijpelijk, de xG was ook slecht", "Statistieken liegen niet", "De kansen zijn er, het afmaken niet", "Prestationeel inderdaad zorgelijk"],
    trash_talk:       ["Vanuit tactisch oogpunt begrijpelijke frustratie", "De pressing klopt echt niet", "Aanvallend te weinig diepte", "Dat zijn reële observaties"],
    cryptic:          ["Context?", "Meer info nodig om dit te beoordelen", "Interessant maar onvolledig"],
    derby:            ["Derby's zijn tactisch altijd interessant", "De mentaliteit telt hier meer dan de formatie", "Beide ploegen spelen anders in derby's"],
    night_chaos:      ["Laat op maar de analyse klopt wel", "Nachtelijke tactiekbespreking", "Interessant tijdstip voor deze observatie"],
  },
  chill: {
    _default:         ["Lekker man 👌", "Tof!", "Nice", "Goed bezig", "Relaxed"],
    neutral:          ["Lekker man 👌", "Tof!", "Nice", "Goed bezig", "Relaxed"],
    high_confidence:  ["Dat gaat wel komen", "Positief blijven", "Ik geloof er wel in", "Tuurlijk gaat het lukken"],
    celebration:      ["Lekker!! 🙌", "Mooi toch", "Genieten maar", "Top!"],
    doubt:            ["Ach het valt mee", "Gewoon kijken wat het wordt", "Relax het komt goed", "Niet te veel zorgen maken"],
    trash_talk:       ["Ik snap de frustratie wel", "Geeft niet hoor", "Rustig blijven 👌", "Het is voetbal"],
    cryptic:          ["Tof", "Nice", "👌", "Oke man"],
    derby:            ["Derby vibes zijn altijd goed 👌", "Lekker potje eraan", "Genieten maar"],
    night_chaos:      ["Late night vibes 🌙", "Lekker rustig nog", "Avond mensen 👌"],
  },
  chaotic: {
    _default:         ["WAT IS DIT 😭", "Ik begrijp er niks van maar ok", "CHAOS 🔥", "Random maar ok 💀"],
    neutral:          ["WAT IS DIT 😭", "Ik begrijp er niks van maar ok", "CHAOS 🔥", "Random maar ok 💀"],
    high_confidence:  ["ALLES KAN ALLES MAG", "DE ENERGIE KLOPT", "????? maar yes 🔥", "VOETBAL IS GEK"],
    celebration:      ["AANNN 🔥🔥", "WAT GEBEURT ER 😭", "IK RAAK NIET MEER BIJ 🔥", "CHAOS CHAOS CHAOS"],
    doubt:            ["WAAROM 😭", "HOE DAN 😭", "NEEEEEE 💀", "Dit kan niet waar zijn"],
    trash_talk:       ["OKE WE GAAN ECHT LOS 😭🔥", "DIT ESCALEERT SNEL", "VUUR 🔥", "IEDEREEN KALM KALM 😭"],
    cryptic:          ["????", "WAT 😭", "UITLEG GRAAG", "CONTEXT????"],
    derby:            ["DERBY DERBY DERBY 🔥😭🔥", "IK KAN NIET NORMAAL DOEN SORRY", "PANIEK EN HYPE TEGELIJK 😭🔥"],
    night_chaos:      ["MIDDEN IN DE NACHT CHAOS 😭🔥", "WE SLAPEN NIET MEER", "NACHTPLOEG IS WAKKER 🌙🔥"],
  },
};

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateFanComment(personality: FanPersonality, tone: ToneCategory): string {
  const pool = TEMPLATES[personality];
  const templates = pool[tone] ?? pool._default;
  return pick(templates);
}

// ─── Admin client ─────────────────────────────────────────────────────────────

function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env vars");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Schedule fan reactions when a post is created ───────────────────────────
// Called client-side — uses browser supabase client.

export interface FanScheduleContext {
  postId:   string;
  caption?: string | null;
}

export async function scheduleFanReactions(ctx: FanScheduleContext): Promise<void> {
  const { data: fans } = await supabase
    .from("fan_personas")
    .select("id, personality")
    .eq("active", true);

  if (!fans || fans.length === 0) return;

  const tone = detectTone(ctx.caption);
  const rows: object[] = [];

  for (const fan of fans) {
    if (Math.random() >= 0.20) continue; // 20% chance per fan

    // Delay: 1 min – 20 min, spread fans out
    const fireAt = new Date(Date.now() + (60_000 + Math.random() * 19 * 60_000)).toISOString();

    rows.push({
      post_id:        ctx.postId,
      fan_persona_id: fan.id,
      fire_at:        fireAt,
      context_json:   { tone, caption: ctx.caption?.slice(0, 200) },
    });
  }

  if (rows.length === 0) return;
  // Ignore duplicate errors — unique constraint prevents double-scheduling
  await supabase.from("pending_fan_reactions").insert(rows);
}

// ─── Process due fan reactions ────────────────────────────────────────────────
// Called by the cron endpoint via processPendingReactions. Uses admin client.

export interface FanProcessResult {
  processed: number;
  skipped:   number;
  errors:    string[];
}

export async function processPendingFanReactions(): Promise<FanProcessResult> {
  const db = adminClient();
  const result: FanProcessResult = { processed: 0, skipped: 0, errors: [] };

  const { data: due, error: fetchError } = await db
    .from("pending_fan_reactions")
    .select("*, fan_personas(id, name, personality)")
    .lte("fire_at", new Date().toISOString())
    .eq("processed", false)
    .order("fire_at", { ascending: true })
    .limit(30);

  if (fetchError) {
    result.errors.push(`Fetch failed: ${fetchError.message}`);
    return result;
  }

  for (const row of due ?? []) {
    try {
      const fan = row.fan_personas as { id: string; name: string; personality: FanPersonality } | null;
      if (!fan) { result.skipped++; continue; }

      const ctx = row.context_json as { tone?: ToneCategory; caption?: string };
      const tone: ToneCategory = ctx.tone ?? "neutral";

      // Mark processed first to prevent double-firing
      await db.from("pending_fan_reactions")
        .update({ processed: true })
        .eq("id", row.id);

      const text = generateFanComment(fan.personality, tone);

      await db.from("comments").insert({
        post_id:      row.post_id,
        username:     fan.name,
        country:      fan.id,   // UUID used as identity marker — detected in CommentsSection
        comment_text: text,
      });

      result.processed++;
    } catch (err) {
      result.errors.push(`Row ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
