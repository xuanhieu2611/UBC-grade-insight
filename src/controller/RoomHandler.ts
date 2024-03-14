import {InsightError, InsightResult} from "./IInsightFacade";
import * as http from "http";

const fileProp: string[] = ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];

interface GeoResponse {
	lat: number;
	lon: number;
}

export default class RoomHandler {
	constructor() {
		// console.log("InsightFacadeImpl::init()");
	}

	private hasProperty(name: any, key: string): boolean {
		if (Object.prototype.hasOwnProperty.call(name, key)) {
			return true;
		}
		return false;
	}

	private removeSpace(s: string): string{
		return s.replace(/(\r\n|\n|\r|" ")/gm, "").trim();
	}

	private isSectionValid(object: any): boolean {
		let flag = true;
		fileProp.forEach((key) => {
			if (!Object.prototype.hasOwnProperty.call(object, key)) {
				flag = false;
			}
		});
		return flag;
	}

	public modelSection(oldObject: any[], idSection: string): InsightResult[] {
		const myArray: InsightResult[] = [];
		oldObject.forEach((value) => {
			if (this.isSectionValid(value)) {
				let newObject: InsightResult = {};
				newObject[idSection + "_uuid"] = value.id.toString();
				newObject[idSection + "_id"] = value.Course;
				newObject[idSection + "_title"] = value.Title;
				newObject[idSection + "_instructor"] = value.Professor;
				newObject[idSection + "_dept"] = value.Subject;
				newObject[idSection + "_year"] = parseFloat(value.Year);
				if (value.Section === "overall") {
					newObject[idSection + "_year"] = 1900;
				}
				newObject[idSection + "_avg"] = parseFloat(value.Avg);
				newObject[idSection + "_pass"] = parseFloat(value.Pass);
				newObject[idSection + "_fail"] = parseFloat(value.Fail);
				newObject[idSection + "_audit"] = parseFloat(value.Audit);
				myArray.push(newObject);
			}
		});
		return myArray;
	}

	private getLatAndLon(address: string): Promise<GeoResponse>{
		return new Promise<GeoResponse>((resolve, reject) => {
			address = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team249/" + encodeURIComponent(address);
			http.get(address, (res: any) => {
				res.setEncoding("utf8");
				let rawData = "";
				res.on("data", (chunk: any) => {
					rawData += chunk;
				});
				res.on("end", () => {
					try {
						const parsedData = JSON.parse(rawData);
						return resolve(parsedData);
					} catch (e) {
						return reject(e);
					}
				});
			});
		});
	}

	private modelBuilding(oldObject: any, idSection: string): Promise<InsightResult> {
		return new Promise<InsightResult>((resolve, reject) => {
			const newObject: InsightResult = {};
			const asyncfunction = oldObject.childNodes.map((child: any) => {
				return new Promise<void> ((resolve2, reject2) => {
					if (child.nodeName === "td"){
						if (child.attrs[0].value === "views-field views-field-field-building-code"){
							newObject[idSection + "_shortname"] = this.removeSpace(child.childNodes[0].value);
							resolve2();
						}else if (child.attrs[0].value === "views-field views-field-title"){
							const temp = child.childNodes[1].childNodes[0].value;
							newObject[idSection + "_fullname"] = this.removeSpace(temp);
							newObject[idSection + "_href"] = child.childNodes[1].attrs[0].value;
							resolve2();
						}else if (child.attrs[0].value === "views-field views-field-field-building-address"){
							newObject[idSection + "_address"] = this.removeSpace(child.childNodes[0].value);
							const temp = this.getLatAndLon(this.removeSpace(child.childNodes[0].value));
							temp.then((data) => {
								newObject[idSection + "_lat"] = data.lat;
								newObject[idSection + "_lon"] = data.lon;
								resolve2();
							}).catch(() => {
								reject2();
							});
						}else{
							resolve2();
						}
					}else{
						resolve2();
					}
				});
			});
			Promise.all(asyncfunction).then(() => {
				if (Object.keys(newObject).length !== 6) {
					return resolve({});
				}
				return resolve(newObject);
			}).catch(() => {
				return reject();
			});
		});
	}

	private getBuildingInfo(tree: any, id: string): Promise<InsightResult[]> {
		return new Promise<InsightResult[]>((resolve, reject) => {
			let myArray: InsightResult[] = [];
			const asyncfunction = tree.childNodes.map((child: any) => {
				return new Promise<void>((resolve2, reject2) => {
					if (child.nodeName === "tr"){
						this.modelBuilding(child, id).then((data) =>{
							if (Object.keys(data).length !== 0){
								myArray = myArray.concat(data);
							}
							resolve2();
						}).catch((err) => {
							reject2();
						});
					}else{
						resolve2();
					}
				});
			});
			Promise.all(asyncfunction).then(() => {
				return resolve(myArray);
			}).catch(() => {
				return reject(new InsightError());
			});
		});
	}

	private containValidBuildingClass(arr: any): boolean {
		for (const child of arr) {
			if (this.hasProperty(child, "name") && this.hasProperty(child, "value")) {
				if (child.name === "class" && child.value === "views-field views-field-field-building-code") {
					return true;
				}
			}
		}
		return false;
	}

	private isValidBuildingTable(tree: any): boolean {
		let flag: boolean = false;
		for (const child of tree.childNodes) {
			if (child.nodeName === "td") {
				if (Object.prototype.hasOwnProperty.call(child, "attrs")
				&& this.containValidBuildingClass(child.attrs)) {
					flag = true;
					break;
				}
			}
			if (Object.prototype.hasOwnProperty.call(child, "childNodes")) {
				if (this.isValidBuildingTable(child)) {
					flag = true;
				}
			}
		}
		return flag;
	}

	private findBuildingListTableHelper(tree: any): any{
		for (const child of tree.childNodes) {
			if (child.nodeName === "tbody") {
				if (this.isValidBuildingTable(child)) {
					return child;
				}
			}
			if (Object.prototype.hasOwnProperty.call(child, "childNodes")) {
				let temp = this.findBuildingListTableHelper(child);
				if (temp !== null){
					return temp;
				}
			}
		}
		return null;
	}

	public findBuildingListTable(tree: any, id: string): Promise<InsightResult[]> {
		return new Promise<InsightResult[]>((resolve, reject) => {
			let myArray: InsightResult[] = [];
			const child = this.findBuildingListTableHelper(tree);
			this.getBuildingInfo(child, id).then((data) => {
				myArray = data;
				resolve(myArray);
			}).catch(() => {
				reject(new InsightError());
			});
		});
	}

	private modelRoom(suffix: any, oldObject: any, idSection: string): InsightResult {
		const newObject: InsightResult = {};
		newObject[idSection + "_shortname"] = suffix[idSection + "_shortname"];
		newObject[idSection + "_fullname"] = suffix[idSection + "_fullname"];
		newObject[idSection + "_href"] = suffix[idSection + "_href"];
		newObject[idSection + "_address"] = suffix[idSection + "_address"];
		newObject[idSection + "_lat"] = suffix[idSection + "_lat"];
		newObject[idSection + "_lon"] = suffix[idSection + "_lon"];
		for (const child of oldObject.childNodes) {
			if (child.nodeName === "td"){
				if (child.attrs[0].value === "views-field views-field-field-room-number"){
					newObject[idSection + "_number"] = this.removeSpace(child.childNodes[1].childNodes[0].value);
				}
				if (child.attrs[0].value === "views-field views-field-field-room-capacity"){
					newObject[idSection + "_seats"] = parseInt(this.removeSpace(child.childNodes[0].value),10);
				}
				if (child.attrs[0].value === "views-field views-field-field-room-furniture"){
					newObject[idSection + "_furniture"] = this.removeSpace(child.childNodes[0].value);
				}
				if (child.attrs[0].value === "views-field views-field-field-room-type"){
					newObject[idSection + "_type"] = this.removeSpace(child.childNodes[0].value);
				}
			}
		}
		newObject[idSection + "_name"] = newObject[idSection + "_shortname"] + "_" + newObject[idSection + "_number"];
		return newObject;
	}

	private getRoomInfo(suffix: any, tree: any, id: string): InsightResult[] {
		let myArray: InsightResult[] = [];
		for (const child of tree.childNodes) {
			if (child.nodeName === "tr"){
				const temp = this.modelRoom(suffix, child, id);
				if (Object.keys(temp).length === 11){
					myArray = myArray.concat(this.modelRoom(suffix, child, id));
				}
			}
		}
		return myArray;
	}

	private containValidRoomClass(arr: any): boolean{
		for (const child of arr) {
			if (this.hasProperty(child, "name") && this.hasProperty(child, "value")) {
				if (child.name === "class" && child.value === "views-field views-field-field-room-number") {
					return true;
				}
			}
		}
		return false;
	}

	private isValidRoomTable(tree: any): boolean {
		let flag: boolean = false;
		for (const child of tree.childNodes) {
			if (child.nodeName === "td") {
				if (Object.prototype.hasOwnProperty.call(child, "attrs") && this.containValidRoomClass(child.attrs)) {
					flag = true;
					break;
				}
			}
			if (Object.prototype.hasOwnProperty.call(child, "childNodes")) {
				if (this.isValidRoomTable(child)) {
					flag = true;
				}
			}
		}
		return flag;
	}

	public findRoomTable(suffix: any, tree: any, id: string): InsightResult[]{
		let myArray: InsightResult[] = [];
		for (const child of tree.childNodes) {
			if (child.nodeName === "tbody") {
				if (this.isValidRoomTable(child)) {
					myArray = this.getRoomInfo(suffix, child, id);
					return myArray;
				}
			}
			if (Object.prototype.hasOwnProperty.call(child, "childNodes")) {
				let temp = this.findRoomTable(suffix, child, id);
				if (temp.length > 0){
					return temp;
				}
			}
		}
		return myArray;
	}
}
