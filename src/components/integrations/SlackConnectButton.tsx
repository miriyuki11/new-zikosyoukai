"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { supabase } from "@/lib/supabase";

type SlackOAuthStartResponse = {
    authorize_url?: unknown;
};

export function SlackConnectButton({ className = '' }: { className?: string }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [connectionCount, setConnectionCount] = useState<number | null>(null);
    const [connectionError, setConnectionError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadConnections() {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                if (!cancelled) setConnectionCount(0);
                return;
            }

            const { data, error: queryError } = await supabase
                .from("user_slack_connections")
                .select("slack_team_id")
                .eq("user_id", user.id);

            if (cancelled) return;
            if (queryError) {
                setConnectionError(true);
                return;
            }
            setConnectionCount(data?.length ?? 0);
        }

        void loadConnections().catch((cause: unknown) => {
            console.error("Failed to load Slack connections:", cause);
            if (!cancelled) setConnectionError(true);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    async function startSlackOAuth() {
        setLoading(true);
        setError("");

        try {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError || !session) {
                setError("連携を始めるにはIntrocardにログインしてください。");
                return;
            }

            const { data, error: functionError } = await supabase.functions.invoke(
                "slack-oauth",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                },
            );

            if (functionError) {
                console.error("Failed to start Slack OAuth:", functionError);
                setError("Slack連携を開始できませんでした。時間をおいて再度お試しください。");
                return;
            }

            const response = data as SlackOAuthStartResponse | null;
            if (typeof response?.authorize_url !== "string") {
                setError("Slackの認証URLを取得できませんでした。");
                return;
            }

            const authorizeUrl = new URL(response.authorize_url);
            if (
                authorizeUrl.protocol !== "https:" ||
                authorizeUrl.hostname !== "slack.com" ||
                authorizeUrl.pathname !== "/oauth/v2/authorize"
            ) {
                setError("Slackの認証URLが不正です。");
                return;
            }

            window.location.assign(authorizeUrl.toString());
        } catch (cause) {
            console.error("Unexpected error starting Slack OAuth:", cause);
            setError("Slack連携を開始できませんでした。時間をおいて再度お試しください。");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            {connectionCount !== null && (
                <p className="mb-1 px-2.5 text-xs opacity-80" role="status">
                    {connectionCount > 0
                        ? `Slack連携済み${connectionCount > 1 ? `（${connectionCount}ワークスペース）` : ""}`
                        : "Slack未連携"}
                </p>
            )}
            {connectionError && (
                <p className="mb-1 px-2.5 text-xs text-destructive" role="alert">
                    Slack連携状態を確認できませんでした。
                </p>
            )}
            <Button
                type="button"
                variant="ghost"
                className={className}
                onClick={startSlackOAuth}
                disabled={loading}
            >
                {loading ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                    <ArrowUpRight aria-hidden="true" />
                )}
                {loading
                    ? "Slackに接続中..."
                    : connectionCount && connectionCount > 0
                    ? "Slackを追加連携"
                    : "Slackと連携する"}
            </Button>
            {error && (
                <p className="mt-2 text-sm text-destructive" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}