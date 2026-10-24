export const Z_INVOCATION = /^\/z(?:\s+([\s\S]*))?$/;

export function parseInvocation(text: string): string | undefined {
	const match = Z_INVOCATION.exec(text);
	return match ? (match[1] ?? "").trim() : undefined;
}

function isQuoted(raw: string): boolean {
	const trimmed = raw.trim();
	return trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"');
}

export function stripOuterQuotes(raw: string): string {
	const trimmed = raw.trim();
	return isQuoted(trimmed) ? trimmed.slice(1, -1) : trimmed;
}

export function queryTerms(raw: string): string[] {
	const trimmed = raw.trim();
	if (!isQuoted(trimmed)) return trimmed.split(/\s+/).filter(Boolean);
	const inner = stripOuterQuotes(trimmed);
	return inner ? [inner] : [];
}

export function firstLine(stdout: string): string | undefined {
	return stdout
		.split("\n")
		.map((line) => line.trim())
		.find(Boolean);
}

export function moveText(
	target: string,
	source: "interactive" | "rpc" | "extension" = "interactive",
) {
	const trimmed = target.trim();
	if (!trimmed || trimmed.includes('"')) return undefined;
	return source === "rpc" ? `/move ${trimmed}` : `/move "${trimmed}"`;
}

export function expandTilde(raw: string, home: string): string {
	if (raw === "~") return home;
	if (raw.startsWith("~/") || raw.startsWith("~\\")) return home + raw.slice(1);
	return raw;
}

export function completions(stdout: string, limit = 20) {
	const seen = new Set<string>();
	const items: { value: string; label: string }[] = [];
	for (const line of stdout.split("\n")) {
		const path = line.trim();
		if (!path || seen.has(path)) continue;
		seen.add(path);
		items.push({ value: path, label: path });
		if (items.length >= limit) break;
	}
	return items;
}
