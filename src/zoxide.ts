import { execFileSync } from "node:child_process";
import { stat } from "node:fs/promises";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { completions, firstLine, moveText, parseInvocation, queryTerms, stripOuterQuotes } from "./jump.ts";

const TIMEOUT_MS = 1500;

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

async function query(pi: ExtensionAPI, raw: string, cwd: string): Promise<string | undefined> {
	const result = await pi.exec("zoxide", ["query", "--", ...queryTerms(raw)], { cwd, timeout: TIMEOUT_MS });
	if (result.code !== 0) return undefined;
	const target = firstLine(result.stdout);
	return target && (await isDirectory(target)) ? target : undefined;
}

async function resolve(pi: ExtensionAPI, raw: string, cwd: string): Promise<string | undefined> {
	const explicit = stripOuterQuotes(raw);
	return (await isDirectory(explicit)) ? explicit : query(pi, raw, cwd);
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
			const target = await resolve(pi, raw, ctx.cwd);
			if (!target) {
				ctx.ui.notify(`zoxide: no match for "${raw}"`, "error");
				return;
			}
			const text = moveText(target);
			ctx.ui.notify(
				text ? `In the TUI this runs: ${text}` : `Cannot /move to ${target}: path contains a double quote`,
				text ? "info" : "error",
			);
		},
	});

	pi.on("input", async (event, ctx) => {
		const raw = parseInvocation(event.text);
		if (raw === undefined) return;
		if (!raw) return { text: "/move" };

		const target = await resolve(pi, raw, ctx.cwd);
		if (!target) {
			ctx.ui.notify(`zoxide: no match for "${raw}"`, "error");
			return { handled: true };
		}
		if (target === ctx.cwd) {
			ctx.ui.notify(`Already in ${target}`, "info");
			return { handled: true };
		}

		const text = moveText(target);
		if (!text) {
			ctx.ui.notify(`Cannot /move to ${target}: path contains a double quote`, "error");
			return { handled: true };
		}
		return { text };
	});
}
