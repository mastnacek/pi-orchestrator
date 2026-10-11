import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LOCALE, LOCALES, normalizeLocale, stringsFor } from "../src/shared/i18n.ts";

test("every locale has a complete string table", () => {
	for (const locale of LOCALES) {
		const s = stringsFor(locale);
		for (const key of [
			"title",
			"commandDesc",
			"ready",
			"confirm",
			"done",
			"routeTitle",
			"noRoute",
			"escalate",
			"herdrWarning",
			"usageRoute",
			"usageAuto",
			"usageDelegate",
			"unknownCommand",
			"compAuto",
			"compRoute",
			"compDelegate",
			"compSplit",
			"compRename",
			"compProfile",
			"compProfileList",
			"compProfileSelect",
			"compProfileSet",
			"compProfileRemove",
			"compProfileMenu",
			"compHelp",
			"compPipeline",
			"pipelineTitle",
			"pipelineUsage",
			"detailedHelp",
			"compStatus",
			"compLang",
			"compLangEn",
			"compLangCs",
			"optSplitNew",
			"optCancel",
			"delegationCancelled",
		] as const) {
			assert.equal(typeof s[key], "string", `${locale}.${key} must be a string`);
			assert.ok(s[key].trim().length > 0, `${locale}.${key} must not be empty`);
		}
		assert.equal(typeof s.status(true), "string");
		assert.equal(typeof s.delegating("target"), "string");
		assert.equal(typeof s.delegated("target"), "string");
		assert.equal(typeof s.collecting("target"), "string");
		assert.equal(typeof s.paneOpened("p1", "dir"), "string");
		assert.equal(typeof s.paneRenamed("p1", "label"), "string");
		assert.equal(typeof s.dialogRouteTitle("pi-uma", 100, "w1:p1", "Label", "pi", "idle", 3), "string");
		assert.equal(typeof s.optSendToPane("w1:p1", "Label", "pi", "idle"), "string");
		assert.equal(typeof s.optOpenNewAndLaunch("pi-uma"), "string");
		assert.equal(typeof s.profileSet("p1", "model"), "string");
		assert.equal(typeof s.profileSelected("p1"), "string");
		assert.equal(typeof s.profileRemoved("p1"), "string");
		assert.equal(typeof s.profileNotFound("p1"), "string");
		assert.equal(typeof s.pipelineRunning(0, 3, "scout"), "string");
		assert.equal(typeof s.pipelineUnknown("nope", "build"), "string");
	}
});

test("an unknown locale is English, never a crash", () => {
	assert.equal(normalizeLocale("klingon"), "en");
	assert.equal(normalizeLocale(undefined), "en");
	assert.equal(stringsFor("nonsense").title, stringsFor("en").title);
});

test("the default locale is the one the scaffold ships", () => {
	assert.equal(stringsFor(DEFAULT_LOCALE).title, "Memory Orchestrator");
	assert.equal(DEFAULT_LOCALE, "en");
});
