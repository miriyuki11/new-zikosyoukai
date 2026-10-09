import { createClient } from "@supabase/supabase-js";
import { verifySlackSignature } from "../_shared/slack.ts";
import {
  formatCommunicationStyles,
  formatHobbyTags,
  formatWorkStyleTags,
} from "../_shared/profile-tags.ts";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void;
};

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

// フィールドの日本語ラベルマッピング
const FIELD_LABELS: Record<string, string> = {
  self_introduction: "自己紹介",
  skills: "スキル・得意分野",
  communication_style: "コミュニケーションスタイル",
  consultation_style: "相談スタイル",
  free_description: "自由記述",
  realtime_status: "ステータス",
  work_style_tags: "働き方",
  hobby_tags: "趣味",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

interface PublicProfileCardRow {
  slug: string;
  full_name: string | null;
  avatar_url: string | null;
  self_introduction: string | null;
  skills: string | null;
  communication_style: string | null;
  consultation_style: string | null;
  free_description: string | null;
  realtime_status: string | null;
  work_style_tags: string[] | null;
  hobby_tags: string[] | null;
}

async function postSlackResponse(
  responseUrl: URL,
  payload: unknown,
): Promise<void> {
  try {
    const response = await fetch(responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Slack response_url request failed:", response.status);
    }
  } catch (error) {
    console.error("Failed to post Slack response:", error);
  }
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Slack signing secret の取得
  const signingSecret = Deno.env.get("SLACK_SIGNING_SECRET");
  const rawBody = await request.text();

  if (!signingSecret) {
    console.error("SLACK_SIGNING_SECRET is not configured");
    return new Response("Server configuration error", { status: 500 });
  }

  const signature = request.headers.get("x-slack-signature");
  const timestamp = request.headers.get("x-slack-request-timestamp");

  const isValid = await verifySlackSignature({
    signingSecret,
    signature,
    timestamp,
    rawBody,
  });

  if (!isValid) {
    console.error("Invalid Slack signature received");
    return new Response("Unauthorized", { status: 401 });
  }

  // Slack slash command から送信された x-www-form-urlencoded ペイロードを解析
  const params = new URLSearchParams(rawBody);
  const text = (params.get("text") || "").trim();
  const teamId = params.get("team_id");
  const callerSlackUserId = params.get("user_id");
  const responseUrlValue = params.get("response_url");
  let responseUrl: URL;

  try {
    responseUrl = new URL(responseUrlValue ?? "");
  } catch {
    return Response.json({ error: "Invalid response URL" }, { status: 400 });
  }

  if (
    responseUrl.protocol !== "https:" ||
    responseUrl.hostname !== "hooks.slack.com"
  ) {
    return Response.json({ error: "Invalid response URL" }, { status: 400 });
  }

  if (!teamId) {
    return Response.json({
      response_type: "ephemeral",
      text: "❌ ワークスペース情報の取得に失敗しました。",
    });
  }

  // /intro @username または /intro <@U1234567|username> などのメンション形式から Slack User ID を抽出
  // Slack のメンション表記は <@U1234567> または <@U1234567|name>
  let targetSlackUserId: string | null = null;
  if (!text && /^U[A-Z0-9]+$/i.test(callerSlackUserId ?? "")) {
    targetSlackUserId = callerSlackUserId;
  }

  const mentionMatch = text.match(/<@([A-Z0-9]+)(?:\|[^>]+)?>/i);

  if (text && mentionMatch) {
    targetSlackUserId = mentionMatch[1];
  } else if (text && text.startsWith("@")) {
    targetSlackUserId = text.substring(1).trim();
  } else if (text && /^[A-Z0-9]{9,12}$/i.test(text)) {
    targetSlackUserId = text;
  }

  if (!targetSlackUserId) {
    return Response.json({
      response_type: "ephemeral",
      text: text
        ? "使い方: `/intro @ユーザー名`\n入力後にSlackの候補から対象ユーザーを選択してください。"
        : "実行ユーザーのSlack IDを取得できませんでした。もう一度お試しください。",
    });
  }

  const resultPromise = (async (): Promise<Response> => {
    // Supabase Service Role クライアントの初期化
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase environment configuration missing");
      return Response.json({
        response_type: "ephemeral",
        text: "❌ サーバー設定エラーが発生しました。",
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    if (!/^U[A-Z0-9]+$/i.test(targetSlackUserId)) {
      const { data: integration, error: integrationError } = await admin
        .from("slack_integrations")
        .select("access_token")
        .eq("team_id", teamId)
        .maybeSingle();

      if (integrationError || !integration?.access_token) {
        console.error("Error loading Slack integration for user lookup:", integrationError);
        return Response.json({
          response_type: "ephemeral",
          text: "❌ Slackユーザーの検索設定を取得できませんでした。",
        });
      }

      const usersResponse = await fetch("https://slack.com/api/users.list", {
        headers: { Authorization: `Bearer ${integration.access_token}` },
      });
      const usersPayload: unknown = await usersResponse.json().catch(() => null);
      const members = isRecord(usersPayload) && Array.isArray(usersPayload.members)
        ? usersPayload.members
        : [];
      const normalizedTarget = targetSlackUserId.replace(/^@/, "").toLowerCase();
      const matchedUser = members.find((member) => {
        if (!isRecord(member)) return false;
        const profile = isRecord(member.profile) ? member.profile : null;
        const candidates = [
          member.name,
          member.real_name,
          profile?.display_name,
          profile?.real_name,
        ];
        return candidates.some(
          (candidate) => typeof candidate === "string" && candidate.toLowerCase() === normalizedTarget,
        );
      });

      if (!isRecord(matchedUser) || typeof matchedUser.id !== "string") {
        return Response.json({
          response_type: "ephemeral",
          text: `⚠️ @${targetSlackUserId} さんをSlackで見つけられませんでした。`,
        });
      }

      targetSlackUserId = matchedUser.id;
    }

    // 1. slack_team_id と slack_user_id から user_slack_connections を検索し、対象の Supabase user_id を特定
    const { data: connection, error: connectionError } = await admin
      .from("user_slack_connections")
      .select("user_id")
      .eq("slack_team_id", teamId)
      .eq("slack_user_id", targetSlackUserId)
      .maybeSingle();

    if (connectionError) {
      console.error("Error looking up user connection:", connectionError);
      return Response.json({
        response_type: "ephemeral",
        text: "❌ ユーザー照会中にエラーが発生しました。",
      });
    }

    if (!connection) {
      return Response.json({
        response_type: "ephemeral",
        text: `⚠️ <@${targetSlackUserId}> さんはまだ Introcard と Slack を連携していません。`,
      });
    }

    // プロフィール設定で公開されている最新カードのslugを取得
    const { data: profileReference, error: profileReferenceError } = await admin
      .from("profile_cards")
      .select("slug")
      .eq("user_id", connection.user_id)
      .eq("is_public", true)
      .not("slug", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (profileReferenceError) {
      console.error("Error finding published profile:", profileReferenceError);
      return Response.json({
        response_type: "ephemeral",
        text: "❌ プロフィールカードの取得中にエラーが発生しました。",
      });
    }

    if (!profileReference?.slug) {
      return Response.json({
        response_type: "ephemeral",
        text: `🔒 <@${targetSlackUserId}> さんのプロフィールカードは非公開に設定されているか、まだ作成されていません。`,
      });
    }

    // 公開ビューを使い、public_fieldsで許可された項目だけ共有する
    const { data: card, error: cardError } = await admin
      .from("public_profile_cards")
      .select("slug, full_name, avatar_url, self_introduction, skills, communication_style, consultation_style, free_description, realtime_status, work_style_tags, hobby_tags")
      .eq("slug", profileReference.slug)
      .maybeSingle();

    if (cardError) {
      console.error("Error fetching published profile:", cardError);
      return Response.json({
        response_type: "ephemeral",
        text: "❌ プロフィールカードの取得中にエラーが発生しました。",
      });
    }

    if (!card) {
      return Response.json({
        response_type: "ephemeral",
        text: `🔒 <@${targetSlackUserId}> さんのプロフィールカードは非公開に設定されているか、まだ作成されていません。`,
      });
    }

    const profileCard = card as unknown as PublicProfileCardRow;

    // 公開ビューから取得したプロフィール項目でBlock Kitを整形
    const fieldsBlocks: { type: string; text: string }[] = [];

    const possibleKeys: (keyof typeof FIELD_LABELS)[] = [
      "self_introduction",
      "skills",
      "communication_style",
      "consultation_style",
      "free_description",
      "realtime_status",
      "work_style_tags",
      "hobby_tags",
    ];

    for (const key of possibleKeys) {
      const val = key === "communication_style"
        ? formatCommunicationStyles(profileCard.communication_style)
        : key === "work_style_tags"
          ? formatWorkStyleTags(profileCard.work_style_tags)
          : key === "hobby_tags"
            ? formatHobbyTags(profileCard.hobby_tags)
            : profileCard[key];
      if (typeof val === "string" && val.trim().length > 0) {
        fieldsBlocks.push({
          type: "mrkdwn",
          text: `*${FIELD_LABELS[key] || key}:*\n${val}`,
        });
      }
    }

    const blocks: unknown[] = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📇 *${profileCard.full_name?.trim() || profileCard.slug}* (<@${targetSlackUserId}>)`,
        },
      },
    ];

    if (profileCard.avatar_url) {
      blocks.push({
        type: "image",
        image_url: profileCard.avatar_url,
        alt_text: `${profileCard.full_name?.trim() || profileCard.slug} のプロフィール画像`,
      });
    }

    if (fieldsBlocks.length > 0) {
      blocks.push({
        type: "section",
        fields: fieldsBlocks,
      });
    } else {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "_公開されているプロフィール項目はありません_",
        },
      });
    }

    return Response.json({
      response_type: "in_channel",
      blocks,
    });
  })();

  EdgeRuntime.waitUntil(
    resultPromise
      .then(async (response) => {
        await postSlackResponse(responseUrl, await response.json());
      })
      .catch(async (error: unknown) => {
        console.error("Unexpected slash command error:", error);
        await postSlackResponse(responseUrl, {
          response_type: "ephemeral",
          text: "❌ プロフィールの取得中にエラーが発生しました。",
        });
      }),
  );

  return Response.json({
    response_type: "ephemeral",
    text: "プロフィールを確認しています...",
  });
});
