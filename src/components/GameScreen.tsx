"use client";
import { useStore } from "@/lib/store";
import { GAMES_BY_ID } from "@/lib/games";
import { TruthOrDare } from "./games/TruthOrDare";
import { DoOrDrink } from "./games/DoOrDrink";
import { NeverHaveIEver } from "./games/NeverHaveIEver";
import { MostLikelyTo } from "./games/MostLikelyTo";
import { WouldYouRather } from "./games/WouldYouRather";
import { Paranoia } from "./games/Paranoia";
import { SpinTheBottle } from "./games/SpinTheBottle";
import { TwoTruths } from "./games/TwoTruths";
import { HotSeat } from "./games/HotSeat";
import { KissMarryAvoid } from "./games/KissMarryAvoid";
import { Fictionary } from "./games/Fictionary";
import { FiveSecond } from "./games/FiveSecond";
import { ForbiddenPhrases } from "./games/ForbiddenPhrases";
import { CheersToTheGovernor } from "./games/CheersToTheGovernor";

export function GameScreen() {
  const { room, isHost, exitGame } = useStore();
  if (!room || !room.currentGame) return null;
  const meta = GAMES_BY_ID[room.currentGame];

  return (
    <main className="min-h-screen max-w-2xl mx-auto p-4 pb-24 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl float-slow">{meta.emoji}</span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Playing</div>
            <div className="title font-black text-lg">{meta.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip border-white/15 text-white/70 bg-white/5 capitalize">{room.intensity}</span>
          {isHost && (
            <button onClick={exitGame} className="btn-ghost !py-2 !px-3 !text-sm">Exit</button>
          )}
        </div>
      </header>

      <GameRouter />
    </main>
  );
}

function GameRouter() {
  const { room } = useStore();
  if (!room?.currentGame) return null;
  switch (room.currentGame) {
    case "truth-or-dare": return <TruthOrDare />;
    case "do-or-drink": return <DoOrDrink />;
    case "never-have-i-ever": return <NeverHaveIEver />;
    case "most-likely-to": return <MostLikelyTo />;
    case "would-you-rather": return <WouldYouRather />;
    case "paranoia": return <Paranoia />;
    case "spin-the-bottle": return <SpinTheBottle />;
    case "two-truths-and-a-lie": return <TwoTruths />;
    case "hot-seat": return <HotSeat />;
    case "kiss-marry-avoid": return <KissMarryAvoid />;
    case "fictionary": return <Fictionary />;
    case "five-second": return <FiveSecond />;
    case "forbidden-phrases": return <ForbiddenPhrases />;
    case "cheers-to-the-governor": return <CheersToTheGovernor />;
    default: return null;
  }
}
