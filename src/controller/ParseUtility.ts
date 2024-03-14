import {InsightError} from "./IInsightFacade";
import {validateQuery, validateApplyKey, validateMComparisonBody, validateSComparisonBody, validateApplyRule,
	validateMKey, validateNumber, validateOptions, validateSKey, validateOrder, validateString,
	validateTransformations} from "./Validator";
export type Query = WhereFiltered | WhereNotFiltered | WhereFilteredTransformed | WhereNotFilteredTransformed;
export interface WhereFiltered {WHERE: Filter, OPTIONS: Options, type: "filtered"}
export interface WhereNotFiltered {WHERE: Record<string, never>, OPTIONS: Options, type: "notFiltered"}
export interface WhereNotFilteredTransformed {
	WHERE: Record<string, never>,
	OPTIONS: Options,
	TRANSFORMATIONS: Transformation,
	type: "notFilteredTransformed"
}
export interface WhereFilteredTransformed {
	WHERE: Filter,
	OPTIONS: Options,
	TRANSFORMATIONS: Transformation,
	type: "filteredTransformed"
}
export interface Transformation {Group: Key[], Apply: ApplyRule[]}
export type Filter = LogicComparison | MComparison | SComparison | Negation;
export type LogicComparison = And | Or;
export interface And {AND: Filter[], type: "and"}
export interface Or {OR: Filter[], type: "or"}
export type MComparison = Lt | Gt | Eq;
export interface Lt {LT: MComparisonBody, type: "lt"}
export interface Gt {GT: MComparisonBody, type: "gt"}
export interface Eq {EQ: MComparisonBody, type: "eq"}
export interface MComparisonBody {mkey: MKey, number: number}
export interface SComparison {IS: SComparisonBody, type: "sComparison"}
export interface SComparisonBody {skey: SKey, inputstring: string}
export interface Negation {NOT: Filter, type: "negation"}
export type Options = OptionOrdered | OptionUnordered | OptionOrderedObj;
export interface OptionOrdered {COLUMNS: AnyKey[], ORDER: AnyKey, type: "ordered"}
export interface OptionUnordered {COLUMNS: AnyKey[], type: "unordered"}
export interface OptionOrderedObj {COLUMNS: AnyKey[], ORDER: OrderObj, type: "orderedObj"}
export interface OrderObj {dir: string, keys: AnyKey[]}
export interface ApplyRule {applyKey: ApplyKey, applyToken: ApplyToken, TokenKey: Key}
export type AnyKey = ApplyKey | Key;
export type Key = MKey | SKey;
export type ApplyToken = "MAX" | "MIN" | "AVG" | "COUNT" | "SUM";
export type MKey = string;
export type SKey = string;
export type ApplyKey = string;

export default class ParseUtility {
	private id: string;

	constructor(id: string) {
		this.id = id;
	}

	public getID(): string {
		return this.id;
	}

	public parseQuery(query: any): Query {
		validateQuery(query);
		this.id = "";
		if (Object.keys(query["WHERE"]).length === 0 && Object.keys(query).length === 2) {
			return {WHERE: {}, OPTIONS: this.parseOptions(query["OPTIONS"]),
				type: "notFiltered"} as WhereNotFiltered;
		}
		if (Object.keys(query["WHERE"]).length === 0 && Object.keys(query).length === 3) {
			return {WHERE: {}, OPTIONS: this.parseOptions(query["OPTIONS"]),
				TRANSFORMATIONS: this.parseTransformations(query["TRANSFORMATIONS"]),
				type: "notFilteredTransformed"} as WhereNotFilteredTransformed;
		}
		if (Object.keys(query).length === 2) {
			return {WHERE: this.parseFilter(query["WHERE"]), OPTIONS: this.parseOptions(query["OPTIONS"]),
				type: "filtered"} as WhereFiltered;
		}
		return {WHERE: this.parseFilter(query["WHERE"]), OPTIONS: this.parseOptions(query["OPTIONS"]),
			TRANSFORMATIONS: this.parseTransformations(query["TRANSFORMATIONS"]),
			type: "filteredTransformed"} as WhereFilteredTransformed;
	}

	private parseTransformations(transformations: any): Transformation {
		validateTransformations(transformations);
		return {Group: this.parseKeyList(transformations["GROUP"]),
			Apply: this.parseApplyList(transformations["APPLY"])};
	}

	private parseFilter(filter: any): Filter {
		if (typeof filter !== "object" || filter === null) {
			throw new InsightError("Filter is not an object");
		}
		if (Object.keys(filter).length !== 1) {
			throw new InsightError("Filter has more than 1 key");
		}
		if (Object.hasOwn(filter, "AND")) {
			return {AND: this.parseFilterList(filter["AND"]), type: "and"} as And;
		}
		if (Object.hasOwn(filter, "OR")) {
			return {OR: this.parseFilterList(filter["OR"]), type: "or"} as Or;
		}
		if (Object.hasOwn(filter, "LT")) {
			return {LT: this.parseMComparisonBody(filter["LT"]), type: "lt"} as Lt;
		}
		if (Object.hasOwn(filter, "GT")) {
			return {GT: this.parseMComparisonBody(filter["GT"]), type: "gt"} as Gt;
		}
		if (Object.hasOwn(filter, "EQ")) {
			return {EQ: this.parseMComparisonBody(filter["EQ"]), type: "eq"} as Eq;
		}
		if (Object.hasOwn(filter, "IS")) {
			return {IS: this.parseSComparisonBody(filter["IS"]), type: "sComparison"} as SComparison;
		}
		if (Object.hasOwn(filter, "NOT")) {
			return {NOT: this.parseFilter(filter["NOT"]), type: "negation"} as Negation;
		}
		throw new InsightError("Invalid Filter");
	}

	private parseFilterList(filterList: any): Filter[] {
		if (Array.isArray(filterList)) {
			if (filterList.length === 0) {
				throw new InsightError("Filter List is empty");
			}
			let retVal: Filter[] = [];
			for (let filter of filterList) {
				retVal.push(this.parseFilter(filter));
			}
			return retVal;
		}
		throw new InsightError("Filter List is not an array");
	}

	private parseMComparisonBody(mComparisonBody: any): MComparisonBody {
		validateMComparisonBody(mComparisonBody);
		let key = Object.keys(mComparisonBody)[0];
		return {mkey: this.parseMKey(key), number: this.parseNumber(mComparisonBody[key])};
	}

	private parseSComparisonBody(sComparisonBody: any): SComparisonBody {
		validateSComparisonBody(sComparisonBody);
		let key = Object.keys(sComparisonBody)[0];
		return {
			skey: this.parseSKey(key),
			inputstring: this.parseString(sComparisonBody[key])
		};
	}

	private parseOptions(options: any): Options {
		validateOptions(options);
		if (Object.keys(options).length === 1) {
			return {COLUMNS: this.parseAnyKeyList(options["COLUMNS"]), type: "unordered"} as OptionUnordered;
		}
		if (typeof options["ORDER"] === "string") {
			return {COLUMNS: this.parseAnyKeyList(options["COLUMNS"]), ORDER: this.parseAnyKey(options["ORDER"]),
				type: "ordered"} as OptionOrdered;
		}
		return {COLUMNS: this.parseAnyKeyList(options["COLUMNS"]), ORDER: this.parseOrder(options["ORDER"]),
			type: "orderedObj"} as OptionOrderedObj;
	}

	private parseOrder(order: any): OrderObj {
		validateOrder(order);
		return {dir: order["dir"], keys: this.parseAnyKeyList(order["keys"])} as OrderObj;
	}

	private parseAnyKeyList(anyKeyList: any): AnyKey[] {
		if (Array.isArray(anyKeyList)) {
			if (anyKeyList.length === 0) {
				throw new InsightError("Key List is empty");
			}
			let retVal: Key[] = [];
			for (let key of anyKeyList) {
				retVal.push(this.parseAnyKey(key));
			}
			return retVal;
		}
		throw new InsightError("Key List is not an array");
	}

	private parseApplyList(applyList: any): ApplyRule[] {
		if (!Array.isArray(applyList)) {
			throw new InsightError("Apply List is not an array");
		}
		let retVal: ApplyRule[] = [];
		for (let applyRule of applyList) {
			retVal.push(this.parseApplyRule(applyRule));
		}
		return retVal;
	}

	private parseApplyRule(applyRule: any): ApplyRule {
		validateApplyRule(applyRule);
		let key = Object.keys(applyRule)[0];
		const token = Object.keys(applyRule[key])[0];
		const validTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
		if (!validTokens.includes(token)) {
			throw new InsightError("ApplyToken is not a valid token");
		}
		return {applyKey: this.parseApplyKey(key), applyToken: token,
			TokenKey: this.parseAnyKey(applyRule[key][token])} as ApplyRule;
	}

	private parseKeyList(keyList: any): Key[] {
		if (Array.isArray(keyList)) {
			if (keyList.length === 0) {
				throw new InsightError("Key List is empty");
			}
			let retVal: Key[] = [];
			for (let key of keyList) {
				retVal.push(this.parseKey(key));
			}
			return retVal;
		}
		throw new InsightError("Key List is not an array");
	}

	private parseAnyKey(anyKey: any): AnyKey {
		try {
			return this.parseKey(anyKey);
		} catch (e) {
			try {
				return this.parseApplyKey(anyKey);
			} catch (f) {
				throw new InsightError("AnyKey is not a valid Key or ApplyKey");
			}
		}
	}

	private parseKey(key: any): Key {
		if (typeof key !== "string") {
			throw new InsightError("Key is not a string");
		}
		try {
			return this.parseMKey(key) as MKey;
		} catch (e) {
			try {
				return this.parseSKey(key) as SKey;
			} catch (f) {
				throw new InsightError("Key is not a valid MKey or SKey");
			}
		}
	}

	private parseMKey(mKey: any): MKey {
		let split = validateMKey(mKey);
		if (this.id === "") {
			this.id = split[0];
		}
		if (this.id !== split[0]) {
			throw new InsightError("MKey has different idstring than previous keys");
		}
		return mKey;
	}

	private parseApplyKey(applyKey: any): ApplyKey {
		validateApplyKey(applyKey);
		return applyKey;
	}

	private parseSKey(sKey: any): SKey {
		let split = validateSKey(sKey);
		if (this.id === "") {
			this.id = split[0];
		}
		if (this.id !== split[0]) {
			throw new InsightError("MKey has different idstring than previous keys");
		}
		return sKey;
	}

	private parseNumber(number: any): number {
		validateNumber(number);
		return number;
	}

	private parseString(inputstring: any): string {
		validateString(inputstring);
		return inputstring;
	}
}
