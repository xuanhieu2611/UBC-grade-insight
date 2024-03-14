import * as pu from "./ParseUtility";
import {InsightError, InsightResult} from "./IInsightFacade";
import {AnyKey, ApplyRule, ApplyToken, Key} from "./ParseUtility";
import Decimal from "decimal.js";

export default class QueryUtility {
	public handleWhere(where: pu.Query, course: any): boolean {
		if (where.type === "notFiltered" || where.type === "notFilteredTransformed") {
			return true;
		}
		return this.handleFilter(where["WHERE"], course);
	}

	private handleFilter(filter: pu.Filter, course: any): boolean {
		if (Object.keys(filter).length !== 2) {
			throw new InsightError("Filter has more than 2 keys");
		}
		if (filter["type"] === "and" || filter["type"] === "or") {
			return this.handleLogicComparison(filter, course);
		}
		if (filter["type"] === "lt" || filter["type"] === "gt" || filter["type"] === "eq") {
			return this.handleMComparison(filter, course);
		}
		if (filter["type"] === "sComparison") {
			return this.handleSComparison(filter["IS"], course);
		}
		if (filter["type"] === "negation") {
			return this.handleNegation(filter, course);
		}
		throw new InsightError("Invalid Filter");
	}

	private handleLogicComparison(logic: pu.LogicComparison, course: any): boolean {
		if (logic["type"] === "and") {
			let retVal = true;
			for (let filter of logic["AND"]) {
				retVal = retVal && this.handleFilter(filter, course);
			}
			return retVal;
		}
		if (logic["type"] === "or") {
			let retVal = false;
			for (let filter of logic["OR"]) {
				retVal = retVal || this.handleFilter(filter, course);
			}
			return retVal;
		}
		throw new InsightError("Invalid Logic Comparison");
	}

	private handleMComparison(mComparison: pu.MComparison, course: any): boolean {
		if (mComparison.type === "lt") {
			const mKey = mComparison["LT"]["mkey"];
			const mValue = mComparison["LT"]["number"];
			const courseValue = course[mKey];
			return courseValue < mValue;
		}
		if (mComparison.type === "gt") {
			const mKey = mComparison["GT"]["mkey"];
			const mValue = mComparison["GT"]["number"];
			const courseValue = course[mKey];
			return courseValue > mValue;
		}
		if (mComparison.type === "eq") {
			const mKey = mComparison["EQ"]["mkey"];
			const mValue = mComparison["EQ"]["number"];
			const courseValue = course[mKey];
			return courseValue === mValue;
		}
		throw new InsightError("Invalid MComparison");
	}

	private handleSComparison(sComparisonBody: pu.SComparisonBody, course: any): boolean {
		const lrWildcardRegex = new RegExp("^\\*[^*]*\\*$");
		const lWildcardRegex = new RegExp("^\\*[^*]*$");
		const rWildcardRegex = new RegExp("^[^*]*\\*$");
		const eWildcardRegex = new RegExp("^[^*]*$");
		if (lrWildcardRegex.test(sComparisonBody["inputstring"])) {
			const sKey = sComparisonBody["skey"];
			const sValue = sComparisonBody["inputstring"];
			const courseValue = course[sKey];
			return courseValue.includes(sValue.substring(1, sValue.length - 1));
		}
		if (lWildcardRegex.test(sComparisonBody["inputstring"])) {
			const sKey = sComparisonBody["skey"];
			const sValue = sComparisonBody["inputstring"];
			const courseValue = course[sKey];
			return courseValue.endsWith(sValue.substring(1));
		}
		if (rWildcardRegex.test(sComparisonBody["inputstring"])) {
			const sKey = sComparisonBody["skey"];
			const sValue = sComparisonBody["inputstring"];
			const courseValue = course[sKey];
			return courseValue.startsWith(sValue.substring(0, sValue.length - 1));
		}
		if (eWildcardRegex.test(sComparisonBody["inputstring"])) {
			const sKey = sComparisonBody["skey"];
			const sValue = sComparisonBody["inputstring"];
			const courseValue = course[sKey];
			return courseValue === sValue;
		}
		throw new InsightError("Invalid SComparisonBody");
	}

	private handleNegation(negation: pu.Negation, course: any): boolean {
		return !this.handleFilter(negation["NOT"], course);
	}

	public handleOptions(options: pu.Options, insightResult: InsightResult[]): void {
		if (options.type === "ordered") {
			this.handleOrderString(options["ORDER"], insightResult);
		}
		if (options.type === "orderedObj") {
			this.handleOrderObject(options["ORDER"], insightResult);
		}
		this.handleColumns(options["COLUMNS"], insightResult);
	}

	private handleOrderString(order: string, insightResults: InsightResult[]): void {
		insightResults.sort((a: InsightResult, b: InsightResult) => {
			if (a[order] < b[order]) {
				return -1;
			}
			if (a[order] > b[order]) {
				return 1;
			}
			return 0;
		});
	}

	private handleOrderObject(order: pu.OrderObj, insightResults: InsightResult[]): void {
		const dir = order["dir"];
		const keys = order["keys"];
		insightResults.sort((a: InsightResult, b: InsightResult) => {
			for (let key of keys) {
				if (a[key] < b[key]) {
					return dir === "UP" ? -1 : 1;
				}
				if (a[key] > b[key]) {
					return dir === "UP" ? 1 : -1;
				}
			}
			return 0;
		});
	}

	private handleColumns(columns: string[], insightResults: InsightResult[]): void {
		for (let property of columns) {
			if (!Object.keys(insightResults[0]).includes(property)) {
				throw new InsightError("COLUMN contains non-existent key");
			}
		}
		for (let insightResult of insightResults) {
			for (let property of Object.keys(insightResult)) {
				if (!columns.includes(property)) {
					delete insightResult[property];
				}
			}
		}
	}

	public handleTransformation(transformation: pu.Transformation, insightResults: InsightResult[]) {
		let groups = transformation["Group"];
		let groupedResults = this.getGroupings(transformation, insightResults);
		let newInsightResults: InsightResult[] = [];
		for (let res of Object.keys(groupedResults)) {
			let newInsightResult: InsightResult = {};
			for (let group of groups) {
				newInsightResult[group] = groupedResults[res][0][group];
			}
			for (let applyRule of transformation["Apply"]) {
				const applyRuleValue = this.getApplyRuleValue(applyRule, groupedResults[res]);
				let a = Object.keys(applyRuleValue)[0];
				newInsightResult[a] = applyRuleValue[a];
			}
			newInsightResults.push(newInsightResult);
		}
		return newInsightResults;
	}

	private getApplyRuleValue(applyRule: pu.ApplyRule, insightResults: InsightResult[]): Record<string, number> {
		const applyKey = applyRule["applyKey"];
		const applyToken = applyRule["applyToken"];
		const applyTokenKey = applyRule["TokenKey"];
		if (applyToken === "COUNT") {
			const unique = new Set();
			for (let insightResult of insightResults) {
				unique.add(insightResult[applyTokenKey]);
			}
			return {[applyKey]: unique.size};
		}
		let allNums: Decimal[] = [];
		for (let insightResult of insightResults) {
			if (typeof insightResult[applyTokenKey] === "string") {
				throw new InsightError("Invalid Apply Token");
			}
			allNums.push(new Decimal(insightResult[applyTokenKey]));
		}
		if (applyToken === "MAX") {
			return {[applyKey]: Decimal.max(...allNums).toNumber()};
		}
		if (applyToken === "MIN") {
			return {[applyKey]: Decimal.min(...allNums).toNumber()};
		}
		if (applyToken === "AVG") {
			let total = new Decimal(0);
			for (let num of allNums) {
				total = total.add(num);
			}
			return {[applyKey]: Number((total.toNumber() / allNums.length).toFixed(2))};
		}
		if (applyToken === "SUM") {
			let total = new Decimal(0);
			for (let num of allNums) {
				total = total.add(num);
			}
			return {[applyKey]: Number(total.toFixed(2))};
		}
		throw new InsightError("Invalid Apply Token");
	}

	private getGroupings(t: pu.Transformation, insightResults: InsightResult[]): Record<string, InsightResult[]> {
		const groups = t["Group"];
		let groupedResults: Record<string, InsightResult[]> = {};
		let groupKeys: string[] = [];
		for (let insightResult of insightResults) {
			const group = this.getGroup(insightResult, groups);
			if (groupKeys.includes(group.toString())) {
				groupedResults[group.toString()].push(insightResult);
			} else {
				groupKeys.push(group.toString());
				groupedResults[group.toString()] = [insightResult];
			}
		}
		return groupedResults;
	}

	private getGroup(insightResult: InsightResult, groups: string[]): string[] {
		let group: string[] = [];
		for (let groupKey of groups) {
			group.push(insightResult[groupKey] as string);
		}
		return group;
	}
}
