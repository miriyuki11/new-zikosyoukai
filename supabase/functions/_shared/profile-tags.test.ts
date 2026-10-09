import { describe, expect, it } from "vitest";
import {
    formatCommunicationStyles,
    formatHobbyTags,
    formatWorkStyleTags,
} from "./profile-tags";

describe("profile tag formatting", () => {
    it("formats configured communication, work, and hobby values as Japanese labels", () => {
        expect(formatCommunicationStyles("speak_proactive, hybrid")).toBe(
            "自分から話すのが得意、状況に応じて",
        );
        expect(formatWorkStyleTags(["remote", "focus-time"])).toBe(
            "リモート中心、集中時間を大切にする",
        );
        expect(formatHobbyTags(["gaming", "reading"])).toBe("ゲーム、読書");
    });

    it("keeps custom tag labels and handles empty values", () => {
        expect(formatWorkStyleTags(["朝型で働く"])).toBe("朝型で働く");
        expect(formatHobbyTags([])).toBe("");
        expect(formatCommunicationStyles(null)).toBe("");
    });
});