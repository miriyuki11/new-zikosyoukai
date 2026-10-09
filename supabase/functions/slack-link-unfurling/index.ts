// supabase/functions/slack-link-unfurling/index.ts

import { createClient } from "@supabase/supabase-js";
import { verifySlackSignature } from "../_shared/slack.ts";
import {
    formatCommunicationStyles,
    formatHobbyTags,
    formatWorkStyleTags,
} from "../_shared/profile-tags.ts";

declare const Deno: {
    env: { get(name: string): string | undefined };
    serve(handler: (request: Request) => Response | Promise<Response>): void;
};

declare const EdgeRuntime: {
    waitUntil(promise: Promise<unknown>): void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

async function chatUnfurl(
    token: string,
    channel: string,
    ts: string,
    unfurls: Record<string, unknown>,
): Promise<void> {
    const res = await fetch("https://slack.com/api/chat.unfurl", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ channel, ts, unfurls }),
    });
    const payload: unknown = await res.json().catch(() => null);
    if (!isRecord(payload) || payload.ok !== true) {
        console.error("chat.unfurl failed:", payload);
    }
}

Deno.serve(async (request: Request) => {
    try {
        if (request.method !== "POST") {
            return new Response("Method Not Allowed", { status: 405 });
        }

        const signingSecret = Deno.env.get("SLACK_SIGNING_SECRET");
        const rawBody = await request.text();

        if (!signingSecret) {
            console.error("SLACK_SIGNING_SECRET is not configured");
            return new Response("Server configuration error", { status: 500 });
        }

        const isValid = await verifySlackSignature({
            signingSecret,
            signature: request.headers.get("x-slack-signature"),
            timestamp: request.headers.get("x-slack-request-timestamp"),
            rawBody,
        });
        if (!isValid) {
            return new Response("Unauthorized", { status: 401 });
        }

        let payload: unknown;
        try {
            payload = JSON.parse(rawBody);
        } catch (error) {
            console.error("Invalid Slack event JSON:", error);
            return new Response("Invalid JSON", { status: 400 });
        }

        if (!isRecord(payload)) {
            return new Response("Bad Request", { status: 400 });
        }

        // Slackの初回URL検証
        if (payload.type === "url_verification" && typeof payload.challenge === "string") {
            return Response.json({ challenge: payload.challenge });
        }

        const event = isRecord(payload.event) ? payload.event : null;
        const teamId = payload.team_id;
        if (event?.type === "link_shared" && typeof teamId === "string") {
            const channel = event.channel;
            const ts = event.message_ts;
            const links = Array.isArray(event.links) ? event.links : [];

            if (typeof channel === "string" && typeof ts === "string" && links.length > 0) {
                // 3秒ルール: 応答は即返し、unfurl処理は非同期で実行
                EdgeRuntime.waitUntil(
                    (async () => {
                        try {
                            const supabaseUrl = Deno.env.get("SUPABASE_URL");
                            const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
                            if (!supabaseUrl || !serviceRoleKey) {
                                console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured");
                                return;
                            }
                            const supabase = createClient(supabaseUrl, serviceRoleKey, {
                                auth: { persistSession: false },
                            });

                            const { data: integration, error: integrationError } = await supabase
                                .from("slack_integrations")
                                .select("access_token")
                                .eq("team_id", teamId)
                                .maybeSingle();
                            if (integrationError || !integration?.access_token) {
                                console.error("Failed to load Slack workspace token:", integrationError);
                                return;
                            }

                            const unfurls: Record<string, unknown> = {};
                            for (const link of links) {
                                if (!isRecord(link) || typeof link.url !== "string") continue;
                                const match = link.url.match(/\/profile\/([^/?#]+)/);
                                if (!match) continue;
                                const slug = decodeURIComponent(match[1]);
                                const { data: card } = await supabase
                                    .from("public_profile_cards")
                                    .select("slug, full_name, avatar_url, self_introduction, skills, communication_style, work_style_tags, hobby_tags")
                                    .eq("slug", slug)
                                    .maybeSingle();

                                if (card) {
                                    const communicationStyles = formatCommunicationStyles(card.communication_style);
                                    const workStyleTags = formatWorkStyleTags(card.work_style_tags);
                                    const hobbyTags = formatHobbyTags(card.hobby_tags);
                                    const profileDetails = [
                                        card.self_introduction
                                            ? `*自己紹介*\n${card.self_introduction}`
                                            : null,
                                        communicationStyles
                                            ? `*コミュニケーションスタイル*\n${communicationStyles}`
                                            : null,
                                        card.skills
                                            ? `*スキル・得意分野*\n${card.skills}`
                                            : null,
                                        workStyleTags
                                            ? `*働き方*\n${workStyleTags}`
                                            : null,
                                        hobbyTags
                                            ? `*趣味*\n${hobbyTags}`
                                            : null,
                                    ].filter((detail): detail is string => detail !== null);

                                    unfurls[link.url] = {
                                        color: "#36a64f",
                                        title: `📇 ${card.full_name || card.slug} のプロフィールカード`,
                                        text: profileDetails.join("\n\n") || "公開されているプロフィール項目はありません。",
                                        ...(card.avatar_url ? { image_url: card.avatar_url } : {}),
                                    };
                                }
                            }

                            if (Object.keys(unfurls).length > 0) {
                                await chatUnfurl(integration.access_token, channel, ts, unfurls);
                            }
                        } catch (error) {
                            console.error("Slack link unfurl background processing failed:", error);
                        }
                    })(),
                );
            }
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Slack link unfurl request failed:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
});