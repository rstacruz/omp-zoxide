import { describe, expect, test } from "bun:test";
import { completions, firstLine, moveText, parseInvocation, queryTerms, stripOuterQuotes } from "./jump.ts";

describe("parseInvocation", () => {
	test("bare /z", () => {
		expect(parseInvocation("/z")).toBe("");
	});

	test("with keywords", () => {
		expect(parseInvocation("/z dotfiles")).toBe("dotfiles");
		expect(parseInvocation("/z   two words  ")).toBe("two words");
	});

	test("other commands", () => {
		expect(parseInvocation("/zoom")).toBeUndefined();
		expect(parseInvocation("/Z dotfiles")).toBeUndefined();
		expect(parseInvocation(" /z dotfiles")).toBeUndefined();
	});
});

describe("stripOuterQuotes", () => {
	test("removes one matching pair", () => {
		expect(stripOuterQuotes('"/home/rsc/My Dir"')).toBe("/home/rsc/My Dir");
		expect(stripOuterQuotes('""')).toBe("");
	});

	test("keeps unmatched or trailing text", () => {
		expect(stripOuterQuotes('"/home/rsc')).toBe('"/home/rsc');
		expect(stripOuterQuotes('/home/rsc"')).toBe('/home/rsc"');
		expect(stripOuterQuotes("unquoted")).toBe("unquoted");
	});
});

describe("queryTerms", () => {
	test("splits on whitespace", () => {
		expect(queryTerms("  dot   files ")).toEqual(["dot", "files"]);
	});

	test("quoted path stays one term", () => {
		expect(queryTerms('"/home/rsc/My Dir"')).toEqual(["/home/rsc/My Dir"]);
		expect(queryTerms("")).toEqual([]);
	});
});

describe("firstLine", () => {
	test("first non-blank trimmed line", () => {
		expect(firstLine("\n  /home/rsc/a \n/home/rsc/b\n")).toBe("/home/rsc/a");
	});

	test("empty output", () => {
		expect(firstLine("")).toBeUndefined();
	});
});

describe("moveText", () => {
	test("quotes the path", () => {
		expect(moveText("/home/rsc/My Dir")).toBe('/move "/home/rsc/My Dir"');
		expect(moveText("  /home/rsc/a  ")).toBe('/move "/home/rsc/a"');
	});

	test("rejects empty and embedded quotes", () => {
		expect(moveText("")).toBeUndefined();
		expect(moveText('/home/rsc/a"b')).toBeUndefined();
	});
});

describe("completions", () => {
	test("trims blank lines and dedupes", () => {
		expect(completions("/a\n\n  /b  \n/a\n")).toEqual([
			{ value: "/a", label: "/a" },
			{ value: "/b", label: "/b" },
		]);
	});

	test("caps the limit", () => {
		const stdout = Array.from({ length: 30 }, (_, i) => `/d${i}`).join("\n");
		expect(completions(stdout, 3).map((item) => item.value)).toEqual(["/d0", "/d1", "/d2"]);
	});
});
