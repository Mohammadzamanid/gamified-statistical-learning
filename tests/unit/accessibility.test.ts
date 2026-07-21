import { describe, expect, it } from "vitest";
import { settingsToAttributes } from "../../src/core/accessibility/apply";
import { SettingsSchema } from "../../src/shared/schemas";

describe("accessibility settings", () => {
  it("maps settings to root data attributes", () => {
    const attrs = settingsToAttributes(SettingsSchema.parse({ theme: "high-contrast", textScale: "xl", reducedMotion: true, colorBlindSafe: true }));
    expect(attrs["data-theme"]).toBe("high-contrast");
    expect(attrs["data-text-scale"]).toBe("xl");
    expect(attrs["data-reduced-motion"]).toBe("true");
    expect(attrs["data-colorblind-safe"]).toBe("true");
  });

  it("defaults are dark / medium / motion on", () => {
    const attrs = settingsToAttributes(SettingsSchema.parse({}));
    expect(attrs["data-theme"]).toBe("dark");
    expect(attrs["data-reduced-motion"]).toBe("false");
  });
});
