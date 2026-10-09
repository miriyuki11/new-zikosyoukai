const COMMUNICATION_STYLE_LABELS: Record<string, string> = {
    speak_proactive: "自分から話すのが得意",
    speak_shy: "自分から話すのが苦手",
    one_on_one_good: "1対1が得意",
    one_on_one_bad: "1対1が苦手",
    group_good: "複数人が得意",
    group_bad: "複数人が苦手",
    proactive: "積極的に話す",
    listening: "聞き役に回る",
    calm: "落ち着いて話す",
    hybrid: "状況に応じて",
    other: "その他",
};

const WORK_STYLE_LABELS: Record<string, string> = {
    remote: "リモート中心",
    "hybrid-work": "出社とリモート併用",
    office: "出社中心",
    async: "非同期で進める",
    "focus-time": "集中時間を大切にする",
    "pair-work": "ペアで進める",
    "flexible-hours": "柔軟な勤務時間",
    other: "その他",
};

const HOBBY_LABELS: Record<string, string> = {
    gaming: "ゲーム",
    reading: "読書",
    travel: "旅行",
    cooking: "料理",
    music: "音楽",
    sports: "スポーツ",
    other: "その他",
};

function formatTags(tags: string[] | null, labels: Record<string, string>): string {
    return (tags ?? []).map((tag) => labels[tag] ?? tag).join("、");
}

export function formatWorkStyleTags(tags: string[] | null): string {
    return formatTags(tags, WORK_STYLE_LABELS);
}

export function formatHobbyTags(tags: string[] | null): string {
    return formatTags(tags, HOBBY_LABELS);
}

export function formatCommunicationStyles(value: string | null): string {
    const styles = (value ?? "").split(",").map((style) => style.trim()).filter(Boolean);
    return formatTags(styles, COMMUNICATION_STYLE_LABELS);
}