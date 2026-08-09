import { useEffect } from "react";
import { useStore } from "../state/store";
import { TopBar } from "../components/TopBar";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { WorldMapScreen } from "../screens/WorldMapScreen";
import { RegionScreen } from "../screens/RegionScreen";
import { LessonScreen } from "../screens/LessonScreen";
import { InvestigationScreen } from "../screens/InvestigationScreen";
import { QuestionScreen } from "../screens/QuestionScreen";
import { LabScreen } from "../screens/LabScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { ReviewScreen } from "../screens/ReviewScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { AboutScreen } from "../screens/AboutScreen";

export function App(): JSX.Element {
  const screen = useStore((s) => s.screen);
  const boot = useStore((s) => s.boot);
  const booted = useStore((s) => s.booted);
  const bootError = useStore((s) => s.bootError);

  useEffect(() => {
    void boot();
  }, []);

  let body: JSX.Element;
  if (!booted) {
    body = <p className="muted">Unrolling the charts…</p>;
  } else if (bootError) {
    body = (
      <div className="feedback incorrect" role="alert">
        <p className="verdict"><span aria-hidden="true">✕</span> Startup problem</p>
        <p>{bootError}</p>
        <p className="muted">Restart the app. If this repeats, your save may be recoverable from Settings → Import.</p>
      </div>
    );
  } else {
    switch (screen.name) {
      case "welcome": body = <WelcomeScreen />; break;
      case "profiles": body = <ProfileScreen />; break;
      case "world-map": body = <WorldMapScreen />; break;
      case "region": body = <RegionScreen regionId={screen.regionId} />; break;
      case "lesson": body = <LessonScreen lessonId={screen.lessonId} />; break;
      case "investigation": body = <InvestigationScreen investigationId={screen.investigationId} />; break;
      case "question": body = <QuestionScreen />; break;
      case "lab": body = <LabScreen />; break;
      case "progress": body = <ProgressScreen />; break;
      case "review": body = <ReviewScreen />; break;
      case "settings": body = <SettingsScreen />; break;
      case "about": body = <AboutScreen />; break;
    }
  }

  return (
    <div className="app-frame">
      <TopBar />
      <main className="app-body">
        <div className="app-body-inner">{body}</div>
      </main>
    </div>
  );
}
