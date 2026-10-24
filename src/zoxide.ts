import { execFileSync } from "node:child_process";
import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import {
	completions,
	expandTilde,
	firstLine,
	moveText,
	parseInvocation,
	queryTerms,
	stripOuterQuotes,
} from "./jump.ts";

const TIMEOUT_MS = 1500;

type Resolution = { target: string } | { error: string };

function zoxideCompletions(prefix: string) {
	try {
		const stdout = execFileSync("zoxide", ["query", "-l", "--", ...queryTerms(prefix)], {
			encoding: "utf8",
			timeout: TIMEOUT_MS,
			stdio: ["ignore", "pipe", "ignore"],
		});
		const items = completions(stdout);
		return items.length ? items : null;
	} catch {
		return null;
	}
}

async function isDirectory(path: string): Promise<boolean> {
	try {
		return (await stat(path)).isDirectory();
	} catch {
		return false;
	}
}

async function query(pi: ExtensionAPI, raw: string, cwd: string): Promise<Resolution> {
	try {
		const result = await pi.exec("zoxide", ["query", "--", ...queryTerms(raw)], { cwd, timeout: TIMEOUT_MS });
		const target = result.code === 0 ? firstLine(result.stdout) : undefined;
		if (target && (await isDirectory(target))) return { target };
		return { error: `zoxide: no match for "${raw}"` };
	} catch {
		return { error: "zoxide is not installed or not in PATH" };
	}
}

async function resolve(pi: ExtensionAPI, raw: string, cwd: string): Promise<Resolution> {
	const explicit = expandTilde(stripOuterQuotes(raw), homedir());
	if (await isDirectory(explicit)) return { target: explicit };
	return query(pi, raw, cwd);
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("z", {
		description: "Jump to a zoxide match (runs /move)",
		getArgumentCompletions: zoxideCompletions,
		handler: async (args, ctx) => {
			const raw = args.trim();
			if (!raw) {
				ctx.ui.notify("Usage: /z <keywords>", "warning");
				return;
			}
			const resolution = await resolve(pi, raw, ctx.cwd);
			if ("error" in resolution) {
				ctx.ui.notify(resolution.error, "error");
				return;
			}
			const text = moveText(resolution.target);
			ctx.ui.notify(
				text
					? `In the TUI this runs: ${text}`
					: `Cannot /move to ${resolution.target}: path contains a double quote`,
				text ? "info" : "error",
			);
		},
	});

	pi.on("input", async (event, ctx) => {
		const raw = parseInvocation(event.text);
		if (raw === undefined) return;
		if (!raw) return { text: "/move" };

		const resolution = await resolve(pi, raw, ctx.cwd);
		if ("error" in resolution) {
			ctx.ui.notify(resolution.error, "error");
			return { handled: true };
		}
		const { target } = resolution;
		if (target === ctx.cwd) {
			ctx.ui.notify(`Already in ${target}`, "info");
			return { handled: true };
		}

		const text = moveText(target, event.source);
		if (!text) {
			ctx.ui.notify(`Cannot /move to ${target}: path contains a double quote`, "error");
			return { handled: true };
		}
		return { text };
	});
}
