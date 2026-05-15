import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { FanPersonality } from "@/lib/supabase";
import { type ToneCategory, detectTone } from "@/lib/commentators";

// ─── Character template pool type ────────────────────────────────────────────

type Pool = Record<ToneCategory | "_default", string[]>;

// ─── Named character templates (Dutch football internet personas) ─────────────

const CHARACTER_TEMPLATES: Record<string, Partial<Pool> & { _default: string[] }> = {

  "dj derksen": {
    _default:        ["Dit is geen voetbal.", "Vroeger hadden ze échte spelers.", "Modern voetbal is een aanfluiting.", "Wat moet dit voorstellen."],
    neutral:         ["Dit is geen voetbal.", "Niemand hier begrijpt het.", "Vroeger hadden ze échte spelers.", "Modern voetbal is een aanfluiting.", "Wat moet dit voorstellen."],
    high_confidence: ["Grote woorden. We zien het.", "Dat zei ik vorig jaar ook. Luisterde niemand naar.", "Overdreven zoals altijd.", "Succes ermee."],
    celebration:     ["Één goal en iedereen flipt. Typisch.", "Dat noemen ze tegenwoordig voetbal.", "Fijn voor ze.", "Rustig blijven mensen."],
    doubt:           ["Eindelijk iemand die het snapt.", "Logisch. Dat had ik al gezien.", "Klopt. Maar niemand wil het horen."],
    trash_talk:      ["Precies dit.", "Dit is de realiteit die mensen weigeren te zien.", "Eindelijk een eerlijk commentaar."],
    cryptic:         ["Wat is dit.", "Geen idee wat dit betekent.", "Oké."],
    derby:           ["Derbyhysterie. Elke keer hetzelfde.", "Mensen doen alsof dit om iets gaat.", "Derby's zijn allang niet meer wat ze waren."],
    night_chaos:     ["Midden in de nacht dit posten. Typisch modern.", "Kan niet slapen van het voetbal? Logisch."],
  },

  "jan boskampinho": {
    _default:        ["SCHITTEREND 😭", "Dat doet wat met mij man 😭", "Ik hou van dit 😭", "Wat een geweldige sport is dit toch 😭"],
    neutral:         ["SCHITTEREND 😭", "Dat doet wat met mij man 😭", "Ik hou van dit 😭", "Wat een geweldige sport is dit toch 😭"],
    high_confidence: ["JA dit gaat ons JAAR worden 😭😭", "SCHITTEREND! Die jongen van... eh... hoe heet die ook alweer! Hij kan VOETBALLEN 😭", "Ik geloof er 100% in 😭 SCHITTEREND"],
    celebration:     ["JAAAAAA 😭😭😭 SCHITTEREND", "Memvis deed het WEER!! 😭😭", "Ik zit te huilen gewoon 😭 SCHITTEREND wat een goal van die... eh... de spits!!", "SCHITTEREND SCHITTEREND SCHITTEREND 😭"],
    doubt:           ["Ik maak me ook een beetje zorgen maar het komt goed 😭 Ik geloof erin", "Die Siep... ik bedoel Siem... of wacht... hoe heet ie... die gaat het redden! 😭", "Niet opgeven!! 😭 SCHITTEREND dat je dit deelt"],
    trash_talk:      ["Zo negatief terwijl die jongen... eh... die linksbuiten... alles geeft 😭", "Mensen altijd maar negatief 😭 Ik ga gewoon genieten van het voetbal"],
    cryptic:         ["SCHITTEREND 😭", "Dit raakt me 😭", "Ja!! 😭"],
    derby:           ["DERBY!!! 😭 SCHITTEREND!!! Ik hou van dit!!", "De spanning!! 😭 SCHITTEREND die van... eh... de linksachter!! Hoe heet ie ook!!!"],
    night_chaos:     ["Kan niet slapen van de voetbalenergie 😭 SCHITTEREND", "Nacht mensen!! 😭 SCHITTEREND dat je nog wakker bent voor het voetbal!!"],
  },

  "moffel": {
    _default:        ["Als die scoort vandaag win ik mijn toto 🤑", "Heb hem in mijn toto staan. Verras me.", "Ik sta op €40 verlies als dit niet goed afloopt.", "Mijn toto hangt aan een zijden draadje."],
    neutral:         ["Als die scoort vandaag win ik mijn toto 🤑", "Heb hem in mijn toto staan. Verras me.", "Ik sta op €40 verlies als dit niet goed afloopt.", "Mijn toto hangt aan een zijden draadje."],
    high_confidence: ["Heb dit al op mijn toto staan. Easy.", "Als dit klopt win ik dit weekend €280. Ik reken erop.", "Dit is precies wat ik nodig heb voor mijn toto 😤"],
    celebration:     ["JA MIJN TOTO!!!!! 🤑🤑🤑", "280 EURO BINNEN 🤑 IK ZEI HET", "Kijk ik WIN ALTIJD als ik geloof in mijn pick 🤑"],
    doubt:           ["Dan verlies ik mijn toto. Prachtig.", "Geweldig. €60 weg omdat die lui niet kunnen voetballen.", "Ik stop met toto. Nee ik stop niet. Maar bijna."],
    trash_talk:      ["Door dit soort prestaties heb ik al €400 verloren dit seizoen.", "Mijn toto is kapot door dit soort posts.", "Als hij zo speelt kan ik hem van mijn toto schrappen."],
    cryptic:         ["Wat betekent dit voor mijn toto.", "Hm. Lastig voor mijn pick.", "Ik moet nadenken over mijn toto."],
    derby:           ["Derby = hoogste odds = ik all-in = €180 winst of complete ramp.", "Heb de derby al op mijn toto. Alles of niks."],
    night_chaos:     ["Ben de hele nacht wakker voor mijn toto uitslag 😤", "Mijn toto eindigt om middernacht. Slaap kan wachten."],
  },

  "abu harb": {
    _default:        ["hoi irak is beste land van voetbal", "dit is goed maar irak beter", "ik kijk altijd voetbal met irak in hart", "mooi post! irak nummer 1 trouwens"],
    neutral:         ["hoi irak is beste land van voetbal", "dit is goed maar irak beter", "ik kijk altijd voetbal met irak in hart", "mooi post! irak nummer 1 trouwens"],
    high_confidence: ["irak ook heel erg goed! wij kunnen dit ook", "mooie woorden maar irak spelers ook zo goed", "wij in irak hebben ook zulke spelers, geloof mij"],
    celebration:     ["feest!! net als irak winnaar 2026!! (bijna)", "goed!! irak gaat dit ook doen volgend jaar", "jaaaa!! irak beste!! dit is bewijs dat voetbal mooi is"],
    doubt:           ["ook irak heeft moeilijke tijden gehad maar wij sterk", "niet opgeven! irak ook niet opgegeven en kijk ons nu", "ik snap de twijfel maar irak gelooft altijd"],
    trash_talk:      ["in irak zeggen wij dit ook maar dan beter", "hahaha dit is niets vergeleken met irak drama", "ik heb dit ook gezien in irak competitie, heel herkenbaar"],
    cryptic:         ["wat dit betekent? in irak begrijpen wij dit ook niet", "irak heeft dit ook gehad", "oke maar irak"],
    derby:           ["irak derby is echt heel groot!! jullie weten niet", "derby energie! irak heeft ook grote derby, bagdad vs basra, klassiek"],
    night_chaos:     ["in irak is nu middag! wij kijken altijd voetbal", "nacht hier maar in irak zijn ze wakker voor de wedstrijd"],
  },

  "henk": {
    _default:        ["Wat leuk zeg ❤️", "Fijn dat je dit deelt! ❤️", "Ik snap er niet alles van maar ik vind het geweldig ❤️", "Speelt die ene jongen vandaag ook mee? ❤️"],
    neutral:         ["Wat leuk zeg ❤️", "Fijn dat je dit deelt! ❤️", "Ik snap er niet alles van maar ik vind het geweldig ❤️", "Speelt die ene jongen vandaag ook mee? ❤️"],
    high_confidence: ["Oh wat mooi! Maar spelen ze dan echt? ❤️", "Gaan ze dan winnen denk je? Ik hoop het zo ❤️", "Dat klinkt goed! Ik snap het niet helemaal maar ik geloof je ❤️"],
    celebration:     ["Oh wat fijn!! ❤️❤️", "Ik zit te klappen hier ❤️ Prachtig!", "Is dat die grote jongen? Die rent zo hard altijd ❤️"],
    doubt:           ["Oh lieverd, het komt echt goed hoor ❤️", "Niet zo somber! Ik geloof erin ❤️", "Ach dat zijn allemaal aardige jongens hoor ❤️"],
    trash_talk:      ["Wat naar zeg 😟 Ik vind dat niet zo netjes ❤️", "Hé, doe maar gewoon lief ❤️", "Allemaal aardige mensen vast ❤️"],
    cryptic:         ["Oh! Wat bedoel je precies? ❤️", "Ik snap het niet helemaal maar het klinkt interessant ❤️", "Wauw ❤️"],
    derby:           ["Is het een grote wedstrijd vandaag? Ik kijk mee met mijn man ❤️", "Speelt die zwarte buitenspeler vandaag weer? ❤️ Die rent altijd zo mooi"],
    night_chaos:     ["Oh wat laat! Pas op je gezondheid hoor ❤️", "Ik ga zo slapen maar succes met de wedstrijd ❤️"],
  },

  "ome corpinho": {
    _default:        ["Wauw. Echt wauw.", "Indrukwekkend. Echt.", "Had dit niet verwacht. Oh wacht, wel dus.", "Tja."],
    neutral:         ["Wauw. Echt wauw.", "Indrukwekkend. Echt.", "Had dit niet verwacht. Oh wacht, wel dus.", "Tja."],
    high_confidence: ["Ja natuurlijk. Iedereen weet het beter.", "Geweldig. Dan is het geregeld.", "Grote woorden. Altijd fijn.", "Oh ja vast."],
    celebration:     ["Ja dit hadden we echt niet kunnen bedenken. Compleet onverwacht.", "Feest. Ongelooflijk feest.", "Nou ja. Lekker dan."],
    doubt:           ["Nee zeg, wie had dit gedacht.", "Verrassend. Totaal verrassend.", "Klopt wel ja."],
    trash_talk:      ["Wauw wat een analyse. Diep.", "Dat is inderdaad een mening.", "Echt schokkend dit.", "Ja dat had ik ook gedacht."],
    cryptic:         ["Oké.", "Interessant.", "Tja.", "Ja dag."],
    derby:           ["O een derby. Dat is zeldzaam.", "Spannend. Nooit eerder vertoond.", "Een derby. Hoe origineel."],
    night_chaos:     ["Midden in de nacht. Logische keuze.", "Kan niet slapen? Begrijpelijk na dit voetbal."],
  },

  "ron dans": {
    _default:        ["GEWELDIG!! Ik heb er zin in! 💪", "Ik geloof dat het kan!! Nooit opgeven!", "Wat een energie!! Ik ben er helemaal klaar voor!! 💪", "Dit is precies de positieve energie die we nodig hebben!!"],
    neutral:         ["GEWELDIG!! Ik heb er zin in! 💪", "Ik geloof dat het kan!! Nooit opgeven!", "Wat een energie!! Ik ben er helemaal klaar voor!! 💪", "Dit is precies de positieve energie die we nodig hebben!!"],
    high_confidence: ["Ja!! Dit is de mentaliteit!! Ik geloof dat het kan!! 💪", "GEWELDIG!! Zo moet je denken!! Nooit opgeven!! 💪", "Dit is de energie waar ik op wacht!! Ik heb er zin in!!"],
    celebration:     ["GEWELDIG!!! Ik zei het toch!! Nooit opgeven!!! 💪💪💪", "JA!!! Dit is waarvoor we leven!! GEWELDIG!!!", "Ik heb er ZIN IN!!! Wat een moment!!!"],
    doubt:           ["Ik snap het maar geloof erin!! Nooit opgeven!! 💪", "Het kan!! Ik geloof dat het kan!! Geef niet op!!", "Weet je wat, ik blijf positief!! Nooit opgeven!! 💪"],
    trash_talk:      ["Kunnen mensen alsjeblieft ophouden met negatief zijn!! Ik heb er zin in!! 💪", "Nooit opgeven mensen!! GEWELDIG dat je dit deelt!!", "GEWELDIG!! Positief blijven!! 💪"],
    cryptic:         ["GEWELDIG!! Ik heb er zin in!!", "Wat er ook mee bedoeld wordt: Ik geloof dat het kan!! 💪"],
    derby:           ["DERBY!! Ik heb er ZIN IN!! GEWELDIG!! Nooit opgeven!! 💪", "Vandaag alles geven!! GEWELDIG!! Ik geloof dat het kan!!"],
    night_chaos:     ["Zelfs midden in de nacht heb ik er zin in!! GEWELDIG!! 💪", "Nooit opgeven!! Ook niet als het laat is!! Ik heb er zin in!!"],
  },

  "jannes": {
    _default:        ["De scheidsrechter leidde het goed vandaag.", "Ik let altijd eerst op de arbitrage.", "Scheidsrechters krijgen nooit genoeg krediet.", "Goed dat mensen voetbal delen, maar denk ook aan de scheids."],
    neutral:         ["De scheidsrechter leidde het goed vandaag.", "Ik let altijd eerst op de arbitrage.", "Scheidsrechters krijgen nooit genoeg krediet.", "Goed dat mensen voetbal delen, maar denk ook aan de scheids."],
    high_confidence: ["Als de arbitrage goed is, kan dit kloppen.", "Klinkt goed, hoop dat de scheidsrechter ook zijn beste dag heeft.", "De uitkomst hangt mede af van de arbitragekwaliteit."],
    celebration:     ["Mooi! En de scheidsrechter heeft het fantastisch gedaan vandaag!", "Geweldig resultaat EN uitstekende arbitrage! Dubbel feest!", "Laten we ook de scheidsrechter bedanken! Briljant geleid!"],
    doubt:           ["Als de arbitrage beter was geweest had dit anders uitgepakt.", "De scheidsrechter deed zijn best. Dat telt.", "Ik begrijp de zorgen maar kijk ook naar de positieve arbitrage momenten."],
    trash_talk:      ["Mensen schelden altijd op de scheids maar die doet gewoon zijn job.", "Geef de scheidsrechter eens wat respect.", "DJ Derksen begrijpt arbitrage weer niet."],
    cryptic:         ["Interessant. Wat vind jij van de arbitrage vandaag?", "Ik vraag me af hoe de scheidsrechter dit interpreteert."],
    derby:           ["Derby! Ik ben al benieuwd naar de scheidsrechtersbezetting! Dit is groot!", "Hoop dat ze een topscheidsrechter aanstellen voor deze derby!"],
    night_chaos:     ["Laat op maar ik ben nog bezig met het analyseren van de arbitrage van vandaag.", "Nacht mensen! Morgen meer scheidsrechter content van mij!"],
  },

  "udo de beatboxer": {
    _default:        ["yo this is big energy fam Huts!", "ik snapt het niet maar yes Huts!", "broeder waT is DIT huts!!", "de vibes zijn er Huts!"],
    neutral:         ["yo this is big energy fam Huts!", "ik snapt het niet maar yes Huts!", "broeder waT is DIT huts!!", "de vibes zijn er Huts!", "okej okej okej Huts!!"],
    high_confidence: ["BRO JA EXACTLY HUTS!!", "ik wist het al want de energie zei mij Huts!", "100% verified by my hart Huts!!", "bro dit IS de waarheid Huts!!"],
    celebration:     ["YOOOOO HUTS HUTS HUTS!!!", "ik ga los in de kamer BRO HUTS!!", "de muziek is aan en dit is the drop HUTS!!!", "HUTS HUTS HUTS broeder!!!!!"],
    doubt:           ["bro dont worry de beat gaat door Huts!", "ik snap de vibes maar ook niet Huts", "sad hours maar ook happy hours Huts!", "bro relax de energie komt terug Huts"],
    trash_talk:      ["bro chill de beatbox stopt nooit Huts", "big energy maar verkeerde kant Huts!", "ik zeg gewoon Huts! en loop weg"],
    cryptic:         ["Huts!", "...Huts?", "wat zeg jij dan Huts!!", "ik hoor je broeder Huts!!"],
    derby:           ["DERBY = GROTE BEAT = HUTS HUTS HUTS!!", "bro de derby energy is als een festival HUTS!!", "ik doe beatbox voor de derby HUTS!!"],
    night_chaos:     ["NACHT RAVE HUTS!! ik slaap nooit Huts!", "de beat stopt nooit ook niet om 3 uur Huts!!", "nacht energie = beste energie Huts!!"],
  },
};

// ─── Generic personality fallback templates ───────────────────────────────────

type GenericPool = Partial<Record<ToneCategory, string[]>> & { _default: string[] };

const PERSONALITY_TEMPLATES: Record<FanPersonality, GenericPool> = {
  sarcastic: {
    _default:        ["Wow heel spannend 😐", "Diep onder de indruk hoor", "Wat een post zeg", "Bijzonder, echt"],
    neutral:         ["Wow heel spannend 😐", "Diep onder de indruk hoor", "Wat een post zeg", "Bijzonder, echt"],
    high_confidence: ["Ja ja we zien het nog wel 😂", "Die zelfverzekerdheid...", "Succes met die verwachtingen", "Kalm aan"],
    celebration:     ["Rustig aan toch", "Het is één goal hoor", "Zo blij om één reden 🙄", "Beetje overdreven?"],
    doubt:           ["Eindelijk eerlijk", "Tja, realistisch", "Herkenbaar ja", "Nee het gaat ook echt niks worden"],
    trash_talk:      ["Oef dat is pittig 😬", "Rustig rustiger", "Agressief vandaag"],
    cryptic:         ["…ok?", "Wat probeer je te zeggen", "Diep 🙄"],
    derby:           ["Oh het is alweer derby-energie hier", "Elke keer hetzelfde circus 🙄"],
    night_chaos:     ["Midden in de nacht dit posten 🙄", "Ga slapen"],
  },
  hype: {
    _default:        ["LEKKER BEZIG 🔥", "Kom op jongens!!!", "Wij gaan dit!!", "Laten we gaan 🙌"],
    neutral:         ["LEKKER BEZIG 🔥", "Kom op jongens!!!", "Wij gaan dit!!", "Laten we gaan 🙌"],
    high_confidence: ["DAT IS DE SPIRIT 💪", "100% GELOOF", "DIT IS ONS JAAR 🔥", "NIEMAND STOPT ONS"],
    celebration:     ["YESSSS 🎉🔥", "GAAN WE!!!", "BRAAAAP 🔥🔥🔥"],
    doubt:           ["HEB VERTROUWEN 💪", "WE GELOVEN ERIN", "NIET OPGEVEN!!!"],
    trash_talk:      ["OKE MAAR WIJ ZIJN BETER 🔥", "LAAT ZE MAAR PRATEN", "VERTROUWEN!!!"],
    cryptic:         ["DE ENERGIE IS GOED", "POSITIEF ALTIJD 💪"],
    derby:           ["DERBY TIJD 🔥🔥🔥", "DIT IS HET MOMENT 💪", "NU OF NOOIT 🔥"],
    night_chaos:     ["NACHT SESSIE 🌙🔥", "LATE NIGHT VOETBAL GANG 🔥"],
  },
  toxic: {
    _default:        ["Typisch 🙄", "Zeg maar niks", "Ja hoor", "Oké dan"],
    neutral:         ["Typisch 🙄", "Zeg maar niks", "Ja hoor", "Oké dan"],
    high_confidence: ["Lol nee", "Droom lekker verder", "Hahaha ok", "Gaat hem echt niet worden"],
    celebration:     ["Feest voor niks", "Wacht maar", "Zo makkelijk blij te maken"],
    doubt:           ["Zie je wel", "Zei ik toch", "Had ik al gezegd"],
    trash_talk:      ["Precies dit ja", "100% mee eens", "Eindelijk iemand die het snapt"],
    cryptic:         ["Oke 🙄", "Whatever", "Boeit me niet"],
    derby:           ["Elke derby hetzelfde gezeik", "Al zat van dit drama"],
    night_chaos:     ["Slapeloze nacht door voetbal, top", "Typisch"],
  },
  funny: {
    _default:        ["Hoe dan 😂", "Bruh", "Ik lach echt 💀", "Niet te geloven"],
    neutral:         ["Hoe dan 😂", "Bruh", "Ik lach echt 💀", "Niet te geloven"],
    high_confidence: ["Grote woorden 😂", "Bro denkt dat hij bondscoach is", "Ja houdoe 😂"],
    celebration:     ["KIJK NAAR HEM GAAN 🤣", "Rust rustig 😂", "Is ie altijd zo?"],
    doubt:           ["Zelfde energie als ik voor een toets 😂", "Broeder van mij 😭", "SAMENGEVAT"],
    trash_talk:      ["Bro is BOOS 😂💀", "Rustig aan 😭", "Ik ga even weg 😂"],
    cryptic:         ["Wat 😭", "OK??", "Bro??? 😂"],
    derby:           ["Elk jaar hetzelfde theater 😂", "Ik lach elke keer"],
    night_chaos:     ["Het is midden in de nacht bro 😂", "Late night banger 😂"],
  },
  tactical: {
    _default:        ["Interessant perspectief", "De balans klopt gewoon niet", "Qua formatie snap ik het wel"],
    neutral:         ["Interessant perspectief", "De balans klopt gewoon niet", "Qua formatie snap ik het wel"],
    high_confidence: ["Als het middenveld staat ja", "De verdediging is het echte probleem", "De xG liegt niet"],
    celebration:     ["Resultaat goed maar het spel moet beter", "Drie punten is drie punten"],
    doubt:           ["Begrijpelijk, de xG was ook slecht", "Statistieken liegen niet"],
    trash_talk:      ["De pressing klopt echt niet", "Aanvallend te weinig diepte"],
    cryptic:         ["Context?", "Meer info nodig om dit te beoordelen"],
    derby:           ["Derby's zijn tactisch altijd interessant", "De mentaliteit telt hier meer dan de formatie"],
    night_chaos:     ["Nachtelijke tactiekbespreking", "Laat op maar de analyse klopt"],
  },
  chill: {
    _default:        ["Lekker man 👌", "Tof!", "Nice", "Goed bezig"],
    neutral:         ["Lekker man 👌", "Tof!", "Nice", "Goed bezig"],
    high_confidence: ["Dat gaat wel komen", "Positief blijven", "Tuurlijk gaat het lukken"],
    celebration:     ["Lekker!! 🙌", "Mooi toch", "Genieten maar", "Top!"],
    doubt:           ["Ach het valt mee", "Relax het komt goed", "Niet te veel zorgen maken"],
    trash_talk:      ["Ik snap de frustratie wel", "Rustig blijven 👌"],
    cryptic:         ["Tof", "👌", "Oke man"],
    derby:           ["Derby vibes zijn altijd goed 👌", "Genieten maar"],
    night_chaos:     ["Late night vibes 🌙", "Avond mensen 👌"],
  },
  chaotic: {
    _default:        ["WAT IS DIT 😭", "Ik begrijp er niks van maar ok", "CHAOS 🔥"],
    neutral:         ["WAT IS DIT 😭", "Ik begrijp er niks van maar ok", "CHAOS 🔥"],
    high_confidence: ["ALLES KAN ALLES MAG", "DE ENERGIE KLOPT", "????? maar yes 🔥"],
    celebration:     ["AANNN 🔥🔥", "WAT GEBEURT ER 😭", "CHAOS CHAOS CHAOS"],
    doubt:           ["WAAROM 😭", "HOE DAN 😭", "NEEEEEE 💀"],
    trash_talk:      ["OKE WE GAAN ECHT LOS 😭🔥", "VUUR 🔥", "IEDEREEN KALM KALM 😭"],
    cryptic:         ["????", "WAT 😭", "CONTEXT????"],
    derby:           ["DERBY DERBY DERBY 🔥😭🔥", "PANIEK EN HYPE TEGELIJK 😭🔥"],
    night_chaos:     ["MIDDEN IN DE NACHT CHAOS 😭🔥", "NACHTPLOEG IS WAKKER 🌙🔥"],
  },
};

// ─── Special one-off lines injected by chance ────────────────────────────────

const RON_DANS_KEUKENROL = "Kunnen mensen aub stoppen met keukenrol roepen 😔 Ik probeer positief te blijven";
const JANNES_DERKSEN_ATTACK = [
  "DJ Derksen begrijpt arbitrage weer niet.",
  "Als DJ Derksen even zijn mond houdt over de scheids zou alles beter zijn.",
  "DJ Derksen heeft nog nooit iets positiefs gezegd over een scheidsrechter. Triest.",
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Comment generation ───────────────────────────────────────────────────────

export function generateFanComment(name: string, personality: FanPersonality, tone: ToneCategory): string {
  const key = name.toLowerCase().trim();

  // Ron Dans: 10% chance of keukenrol complaint regardless of tone
  if (key === "ron dans" && Math.random() < 0.10) {
    return RON_DANS_KEUKENROL;
  }

  // Jannes: 15% chance of unprompted DJ Derksen attack
  if (key === "jannes" && Math.random() < 0.15) {
    return pick(JANNES_DERKSEN_ATTACK);
  }

  const characterPool = CHARACTER_TEMPLATES[key];
  if (characterPool) {
    const templates = characterPool[tone] ?? characterPool._default;
    return pick(templates);
  }

  // Fallback: generic personality templates
  const pool = PERSONALITY_TEMPLATES[personality];
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
    if (Math.random() >= 0.20) continue; // 20% chance per fan, independent rolls

    // Delay: 1 min – 20 min, each fan gets their own random window
    const fireAt = new Date(Date.now() + (60_000 + Math.random() * 19 * 60_000)).toISOString();

    rows.push({
      post_id:        ctx.postId,
      fan_persona_id: fan.id,
      fire_at:        fireAt,
      context_json:   { tone, caption: ctx.caption?.slice(0, 200) },
    });
  }

  if (rows.length === 0) return;
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

      // Mark processed first to prevent double-firing on concurrent runs
      await db.from("pending_fan_reactions")
        .update({ processed: true })
        .eq("id", row.id);

      const text = generateFanComment(fan.name, fan.personality, tone);

      await db.from("comments").insert({
        post_id:      row.post_id,
        username:     fan.name,
        country:      fan.id,
        comment_text: text,
      });

      result.processed++;
    } catch (err) {
      result.errors.push(`Row ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
