import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError,
	NotFoundError,
	InsightDataset,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives} from "../TestUtil";

use(chaiAsPromised);

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let emptySection: string;
	let invalidSection: string;
	let sectionsBig: string;
	let roomSection: string;
	let smallRoom: string, noHTML: string, noBuildingTable: string, noBuildingFile: string;

	before(function () {
		// This block runs once and loads the datasets.
		sections = getContentFromArchives("small.zip");
		sectionsBig = getContentFromArchives("pair.zip");
		emptySection = getContentFromArchives("empty.zip");
		invalidSection = getContentFromArchives("invalid.zip");
		roomSection = getContentFromArchives("campus.zip");
		smallRoom = getContentFromArchives("smallRoom.zip");
		noHTML = getContentFromArchives("noHTML.zip");
		noBuildingFile = getContentFromArchives("noBuildingFile.zip");
		noBuildingTable = getContentFromArchives("noBuildingTable.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		clearDisk();
	});
	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			facade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			clearDisk();
		});

		// This is a unit test. You should create more like this!
		it ("should successfully add a dataset (first)", function() {
			const result = facade.addDataset("sections", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["sections"]);
		});

		it ("should successfully add a dataset (second)", function() {
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		it ("should successfully add two datasets", function() {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.addDataset("ubc2", sections, InsightDatasetKind.Sections)
				);
			return expect(result).to.eventually.have.members(["ubc", "ubc2"]);
		});

		it ("should successfully add three datasets", function() {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.addDataset("ubc2", sections, InsightDatasetKind.Sections)).then(() =>
					facade.addDataset("ubc3", sections, InsightDatasetKind.Sections));
			return expect(result).to.eventually.have.members(["ubc", "ubc2", "ubc3"]);
		});

		it ("should reject with empty zip", function() {
			clearDisk();
			const result = facade.addDataset("sections", emptySection, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject with invalid section", function() {
			const result = facade.addDataset("sections", invalidSection, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject with an empty dataset id", function() {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject with an '_' in the start the id", function() {
			const result = facade.addDataset("_ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject with an '_' in the end the id", function() {
			const result = facade.addDataset("ubc_", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject with an '_' in the middle of the id", function() {
			const result = facade.addDataset("u_bc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject with an id as a space", function() {
			const result = facade.addDataset(" ", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject with an id as multiple spaces", function() {
			const result = facade.addDataset("   ", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject with an id as a tab", function() {
			const result = facade.addDataset("\t", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject with an id as a newline", function() {
			const result = facade.addDataset("\n", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject with an id as a carriage return", function() {
			const result = facade.addDataset("\r", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject with an id as a combination of whitespaces", function() {
			const result = facade.addDataset(" \t\n\r", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject with a duplicate id (add)", function() {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.addDataset("ubc", sections, InsightDatasetKind.Sections)
				);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("dataset is not a valid kind", function() {
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should successfully remove a dataset (1/1)", function () {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.removeDataset("ubc")
				);
			return expect(result).to.eventually.equal("ubc");
		});

		it("should successfully remove a dataset (1/2)", function () {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.addDataset("ubc2", sections, InsightDatasetKind.Sections)).then(() =>
					facade.removeDataset("ubc")
				);
			return expect(result).to.eventually.equal("ubc");
		});

		it("should successfully remove datasets (2/2)", function () {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.addDataset("ubc2", sections, InsightDatasetKind.Sections)).then(() =>
					facade.removeDataset("ubc")).then(() =>
					facade.removeDataset("ubc2")
				);
			return expect(result).to.eventually.equal("ubc2");
		});

		it("should successfully remove same dataset twice", function () {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.removeDataset("ubc")).then(() =>
					facade.addDataset("ubc", sections, InsightDatasetKind.Sections)).then(() =>
					facade.removeDataset("ubc")
				);
			return expect(result).to.eventually.equal("ubc");
		});

		it("should reject with a non-existent dataset id (remove)", function () {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.removeDataset("ubc2")
				);
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("should reject with an empty dataset id (remove)", function () {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.removeDataset("")
				);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a whitespace name (remove)", function () {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.removeDataset(" ")
				);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a underscore in the end of id (remove)", function () {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.removeDataset("ubc_")
				);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a underscore in the start of id (remove)", function () {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.removeDataset("_ubc")
				);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a underscore in the middle of the id (remove)", function () {
			const result =
				facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() =>
					facade.removeDataset("u_bc")
				);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should successfully list no datasets", function() {
			const ans: InsightDataset[] = [];
			const result = facade.listDatasets();
			return expect(result).to.eventually.have.members(ans);
		});

		it("should successfully list one dataset", async function() {
            // Setup
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
            // Execution
			const datasets = await facade.listDatasets();
            // Validation
			return expect(datasets).to.deep.equal([{
				id: "ubc",
				kind: InsightDatasetKind.Sections,
				numRows: 38
			}]);
		});

		it("should successfully list two datasets", async function() {
            // Setup
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			await facade.addDataset("ubc2", sections, InsightDatasetKind.Sections);
            // Execution
			const datasets = await facade.listDatasets();
            // Validation
			return expect(datasets).to.deep.equal([
				{id: "ubc", kind: InsightDatasetKind.Sections, numRows: 38},
				{id: "ubc2", kind: InsightDatasetKind.Sections, numRows: 38}
			]);
		});

		it("should successfully handle crashes (list a added data after crash)", async function() {
            // Setup
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			let facade2 = new InsightFacade();
			const result = await facade2.listDatasets();
            // Validation
			return expect(result).to.deep.equal([
				{id: "ubc", kind: InsightDatasetKind.Sections, numRows: 38}
			]);
		});

		it("should successfully handle crashes (can't added the same data after crash)", function() {
            // Setup
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections).then(() => {
				let facade2 = new InsightFacade();
				return facade2.addDataset("ubc", sections, InsightDatasetKind.Sections);
			});
            // Validation
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});

	//  * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	//  * You should not need to modify it; instead, add additional files to the queries directory.
	//  * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	//  *
	describe("add/remove/list room dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			facade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			clearDisk();
		});

		it("should successfully add a ROOM dataset (first)", function () {
			const result = facade.addDataset("rooms", roomSection, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["rooms"]);
		});

		it ("should successfully add two ROOM datasets", function() {
			const result =
				facade.addDataset("ubc", smallRoom, InsightDatasetKind.Rooms).then(() =>
					facade.addDataset("ubc2", smallRoom, InsightDatasetKind.Rooms)
				);
			return expect(result).to.eventually.have.members(["ubc", "ubc2"]);
		});

		it ("should successfully add three ROOM datasets", function() {
			const result =
				facade.addDataset("ubc", smallRoom, InsightDatasetKind.Rooms).then(() =>
					facade.addDataset("ubc2", smallRoom, InsightDatasetKind.Rooms)).then(() =>
					facade.addDataset("ubc3", smallRoom, InsightDatasetKind.Rooms));
			return expect(result).to.eventually.have.members(["ubc", "ubc2", "ubc3"]);
		});

		it("should successfully remove a ROOM dataset (1/1)", function () {
			const result =
				facade.addDataset("ubc", smallRoom, InsightDatasetKind.Rooms).then(() =>
					facade.removeDataset("ubc")
				);
			return expect(result).to.eventually.equal("ubc");
		});

		it ("should successfully list no datasets", function() {
			const ans: InsightDataset[] = [];
			const result = facade.listDatasets();
			return expect(result).to.eventually.have.members(ans);
		});

		it("should successfully list one dataset", async function() {
            // Setup
			await facade.addDataset("ubc", smallRoom, InsightDatasetKind.Rooms);
            // Execution
			const datasets = await facade.listDatasets();
            // Validation
			return expect(datasets).to.deep.equal([{
				id: "ubc",
				kind: InsightDatasetKind.Rooms,
				numRows: 61
			}]);
		});

		it("should successfully list two datasets", async function() {
            // Setup
			await facade.addDataset("ubc", smallRoom, InsightDatasetKind.Rooms);
			await facade.addDataset("ubc2", smallRoom, InsightDatasetKind.Rooms);
            // Execution
			const datasets = await facade.listDatasets();
            // Validation
			return expect(datasets).to.deep.equal([
				{id: "ubc", kind: InsightDatasetKind.Rooms, numRows: 61},
				{id: "ubc2", kind: InsightDatasetKind.Rooms, numRows: 61}
			]);
		});

		it("should successfully handle crashes (list a added ROOM data after crash)", async function() {
            // Setup
			await facade.addDataset("ubc", smallRoom, InsightDatasetKind.Rooms);
			let facade2 = new InsightFacade();
			const result = await facade2.listDatasets();
            // Validation
			return expect(result).to.deep.equal([
				{id: "ubc", kind: InsightDatasetKind.Rooms, numRows: 61}
			]);
		});

		it("should successfully handle crashes (can't added the same data after crash)", function() {
            // Setup
			const result = facade.addDataset("ubc", smallRoom, InsightDatasetKind.Rooms).then(() => {
				let facade2 = new InsightFacade();
				return facade2.addDataset("ubc", smallRoom, InsightDatasetKind.Rooms);
			});
            // Validation
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should successfully handle crashes (remove a added dataset)", function() {
            // Setup
			const ans: InsightDataset[] = [];
			const result = facade.addDataset("ubc", smallRoom, InsightDatasetKind.Rooms).then(() => {
				let facade2 = new InsightFacade();
				return facade2.removeDataset("ubc");
			}).then(() => {
				return facade.listDatasets();
			});
            // Validation
			return expect(result).to.eventually.have.members(ans);
		});

		it("should reject with no index.htm file", function () {
			const result = facade.addDataset(" ", noHTML, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with no building table file", function () {
			const result = facade.addDataset(" ", noBuildingTable, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with no building file file", function () {
			const result = facade.addDataset(" ", noBuildingFile, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

	});

	describe("performQuery", function() {
		type Input = unknown;
		type Output = InsightResult[];
		type Error = "InsightError" | "ResultTooLargeError";
		before(async function() {
			clearDisk();
			sectionsBig = getContentFromArchives("pair.zip");
			facade = new InsightFacade();
			await facade.addDataset("sections", sectionsBig, InsightDatasetKind.Sections);
			await facade.addDataset("rooms", roomSection, InsightDatasetKind.Rooms);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			clearDisk();
		});

		function errorValidator(error: any): error is Error {
			return error === "InsightError" || error === "ResultTooLargeError";
		}
		function assertOnError(actual: any, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.instanceof(InsightError);
			} else if (expected === "ResultTooLargeError") {
				expect(actual).to.be.instanceof(ResultTooLargeError);
			} else {
				expect.fail("UNEXPECTED ERROR");
			}
		}
		function assertOnResult(actual: unknown, expected: Output): void {
			expect(actual).to.have.deep.members(expected);
		}
		function target(input: Input): Promise<Output> {
			return facade.performQuery(input);
		}
		folderTest<Input, Output, Error>(
			"Add Dynamic",
			target,
			"./test/resources/queries",
			{
				errorValidator,
				assertOnError,
				assertOnResult
			}
		);
	});
});
