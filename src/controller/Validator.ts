import {InsightError} from "./IInsightFacade";

export function validateQuery(query: any) {
	if (typeof query !== "object" || query === null) {
		throw new InsightError("Query is not an object");
	}
	if (!Object.hasOwn(query, "WHERE") || !Object.hasOwn(query, "OPTIONS")) {
		throw new InsightError("Query does not have WHERE or OPTIONS");
	}
	if (Object.keys(query).length !== 2 && Object.keys(query).length !== 3) {
		throw new InsightError("Query has an invalid number of keys");
	}
	if (Object.keys(query).length === 3 && !Object.hasOwn(query, "TRANSFORMATIONS")) {
		throw new InsightError("Query has 3 keys and one of them is not TRANSFORMATIONS");
	}
	if (typeof query["WHERE"] !== "object" || query["WHERE"] === null || Array.isArray(query["WHERE"])) {
		throw new InsightError("WHERE is not an object");
	}
}

export function validateTransformations(transformations: any) {
	if (typeof transformations !== "object" || transformations === null) {
		throw new InsightError("Transformations is not an object");
	}
	if (Object.keys(transformations).length !== 2) {
		throw new InsightError("Transformations has more than 2 keys");
	}
	if (!Object.hasOwn(transformations, "GROUP") || !Array.isArray(transformations["GROUP"])) {
		throw new InsightError("Transformations does not have GROUP array");
	}
	if (!Object.hasOwn(transformations, "APPLY") || !Array.isArray(transformations["APPLY"])) {
		throw new InsightError("Transformations does not have APPLY array");
	}
}

export function validateMComparisonBody(mComparisonBody: any) {
	if (typeof mComparisonBody !== "object" || mComparisonBody === null) {
		throw new InsightError("MComparisonBody is not an object");
	}
	if (Object.keys(mComparisonBody).length !== 1) {
		throw new InsightError("MComparisonBody has more than 1 key");
	}
}

export function validateSComparisonBody(sComparisonBody: any) {
	if (typeof sComparisonBody !== "object" || sComparisonBody === null) {
		throw new InsightError("SComparisonBody is not an object");
	}
	if (Object.keys(sComparisonBody).length !== 1) {
		throw new InsightError("SComparisonBody has more than 1 key");
	}
}

export function validateOptions(options: any) {
	if (typeof options !== "object" || options === null) {
		throw new InsightError("Options is not an object");
	}
	if (Object.keys(options).length !== 1 && Object.keys(options).length !== 2) {
		throw new InsightError("Options has more than 2 keys");
	}
	if (!Object.hasOwn(options, "COLUMNS") || !Array.isArray(options["COLUMNS"])) {
		throw new InsightError("Options does not have COLUMNS array");
	}
	if (Object.keys(options).length !== 1 && (!Object.hasOwn(options, "ORDER") ||
        (typeof options["ORDER"] !== "string" && typeof options["ORDER"] !== "object"))) {
		throw new InsightError("Options does not have ORDER string or object");
	}
}

export function validateOrder(order: any) {
	if (typeof order !== "object" || order === null) {
		throw new InsightError("Order is not an object");
	}
	if (Object.keys(order).length !== 2) {
		throw new InsightError("Order has more than 2 keys");
	}
	if (!Object.hasOwn(order, "dir") || typeof order["dir"] !== "string") {
		throw new InsightError("Order does not have dir string");
	}
	if (!Object.hasOwn(order, "keys") || !Array.isArray(order["keys"])) {
		throw new InsightError("Order does not have keys array");
	}
	if (order["dir"] !== "UP" && order["dir"] !== "DOWN") {
		throw new InsightError("Order dir is not UP or DOWN");
	}
}

export function validateApplyRule(applyRule: any) {
	if (typeof applyRule !== "object" || applyRule === null) {
		throw new InsightError("ApplyRule is not an object");
	}
	if (Object.keys(applyRule).length !== 1) {
		throw new InsightError("ApplyRule has more than 1 key");
	}
	if (typeof applyRule[Object.keys(applyRule)[0]] !== "object" || applyRule[Object.keys(applyRule)[0]] === null) {
		throw new InsightError("ApplyToken is not an object");
	}
	if (Object.keys(applyRule[Object.keys(applyRule)[0]]).length !== 1) {
		throw new InsightError("ApplyToken value has more than 1 key");
	}
}

export function validateNumber(number: any) {
	if (typeof number !== "number") {
		throw new InsightError("Number is not a number");
	}
}

export function validateString(inputstring: any) {
	if (typeof inputstring !== "string") {
		throw new InsightError("Inputstring is not a string");
	}
}

export function validateSKey(sKey: any) {
	const validSFields = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname", "number",
		"name", "address", "type", "furniture", "href"];
	if (typeof sKey !== "string") {
		throw new InsightError("SKey is not a string");
	}
	if (!sKey.includes("_")) {
		throw new InsightError("SKey does not contain an underscore");
	}
	let split = sKey.split("_");
	if (split.length !== 2) {
		throw new InsightError("SKey has more than 1 underscore");
	}
	if (split[0] === "" || split[1] === "") {
		throw new InsightError("SKey has empty idstring or sfield");
	}
	if (!validSFields.includes(split[1])) {
		throw new InsightError("SKey has invalid sfield");
	}
	const regex = new RegExp("^[^_]+$");
	if (!regex.test(split[0])) {
		throw new InsightError("SKey contains invalid idstring characters");
	}
	return split;
}

export function validateApplyKey(applyKey: any) {
	if (typeof applyKey !== "string") {
		throw new InsightError("ApplyKey is not a string");
	}
	if (applyKey.includes("_")) {
		throw new InsightError("ApplyKey contains an underscore");
	}
	if (applyKey === "") {
		throw new InsightError("ApplyKey is empty");
	}
}

export function validateMKey(mKey: any) {
	if (typeof mKey !== "string") {
		throw new InsightError("MKey is not a string");
	}
	if (!mKey.includes("_")) {
		throw new InsightError("MKey does not contain an underscore");
	}
	let split = mKey.split("_");
	if (split.length !== 2) {
		throw new InsightError("MKey has more than 1 underscore");
	}
	if (split[0] === "" || split[1] === "") {
		throw new InsightError("MKey has empty idstring or mfield");
	}
	if (split[1] !== "avg" && split[1] !== "pass" && split[1] !== "fail" && split[1] !== "audit" &&
        split[1] !== "year" && split[1] !== "lat" && split[1] !== "lon" && split[1] !== "seats") {
		throw new InsightError("MKey has invalid mfield");
	}
	const regex = new RegExp("^[^_]+$");
	if (!regex.test(split[0])) {
		throw new InsightError("MKey contains invalid idstring characters");
	}
	return split;
}
