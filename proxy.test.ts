import { describe, expect, it } from "vitest";
import { shouldBypassAuth } from "./proxy";

describe("shouldBypassAuth", () => {
    it.each(["/profile/alice", "/team/team-123", "/teams/team-123"])(
        "allows public route %s",
        (pathname) => {
            expect(shouldBypassAuth(pathname)).toBe(true);
        }
    );

    it.each([
        "/",
        "/profile",
        "/profile/settings",
        "/profile/edit",
        "/profile/alice/edit",
        "/teams",
        "/teams/create",
        "/teams/team-123/edit",
        "/dashboard/teams",
        "/team/team-123/members",
    ])("requires auth for protected route %s", (pathname) => {
        expect(shouldBypassAuth(pathname)).toBe(false);
    });
});