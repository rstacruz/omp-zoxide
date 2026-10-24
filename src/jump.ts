export const Z_INVOCATION = /^\/z(?:\s+([\s\S]*))?$/;

export function parseInvocation(text: string): string | undefined {
	const match = Z_INVOCATION.exec(text);
	return match ? (match[1] ?? "").trim() : undefined;
}

export function stripOuterQuotes(raw: string): string {
	const trimmed = raw.trim();
	return trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')
		? trimmed.slice(1, -1)
		: trimmed;
}

export function queryTerms(raw: string): string[] {
	const trimmed = raw.trim();
	const unquoted = stripOuterQuotes(trimmed);
	// A wholly quoted path is one term even when it contains spaces.
	if (unquoted !== trimmed) return unquoted ? [unquoted] : [];
	return trimmed.split(/\s+/).filter(Boolean);
}

export function firstLine(stdout: string): string | undefined {
	return stdout
		.split("\n")
		.map((line) => line.trim())
		.find(Boolean);
}

export function moveText(target: string): string | undefined {
	const trimmed = target.trim();
	if (!trimmed || trimmed.includes('"')) return undefined;
	return `/move "${trimmed}"`;
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
