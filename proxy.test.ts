import { describe, expect, it } from "vitest";
import { shouldBypassAuth } from "./proxy";

describe("shouldBypassAuth", () => {
    it.each(["/profile/alice"])(
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
    ])("requires auth for protected route %s", (pathname) => {
        expect(shouldBypassAuth(pathname)).toBe(false);
    });
});