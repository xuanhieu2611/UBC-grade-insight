import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import ParseUtility, * as pu from "./ParseUtility";
import * as qu from "./QueryUtility";
import * as fs from "fs-extra";
import JSZip from "jszip";
import * as parse5 from "parse5";
import * as rh from "./RoomHandler";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
	constructor() {
		// console.log("InsightFacadeImpl::init()");
	}

	private isIdValid(id: string): boolean {
		if (id.length === 0 || id.includes("_")) {
			return false;
		}
		if (!id.replace(/\s/g, "").length) {
			return false;
		}
		return true;
	}

	private isExisted(id: string): boolean {
		return fs.pathExistsSync("./data/" + id);
	}

	private addDataSectionHelper(zip: JSZip, id: string): Promise<InsightResult[]>{
		let idPath = "./data/" + id;
		const roomHandler = new rh.default();
		return new Promise<InsightResult[]>((resolve, reject) => {
			let myArray: InsightResult[] = [];
			const myInsideFiles = zip.filter((relativePath, file) => {
				return !relativePath.match((/^__MACOSX\//) || (/courses\//));
			});
			const asyncFunction = myInsideFiles.map((key, index) => {
				return new Promise<void>((resolve3, reject3) => {
					const path: string = key.name;
					if (path === "courses/"){
						return resolve3();
					}
					zip.file(path)?.async("string").then((data) => {
						const temp = JSON.parse(data);
						myArray = myArray.concat(roomHandler.modelSection(temp.result, id));
						return resolve3();
					}).catch((err) => {
						fs.removeSync(idPath);
						return reject(new InsightError());
					});
				});
			});
			return Promise.all(asyncFunction).then(() => {
				if(myArray.length === 0) {
					fs.removeSync(idPath);
					return reject(new InsightError());
				}
				return resolve(myArray);
			});
		});
	}

	private addDatasetSection(id: string, content: string): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			const idPath = "./data/" + id;
			fs.ensureDir(idPath).then(() => {
				return JSZip.loadAsync(content, {base64:true});
			}).then((zip) => {
				return this.addDataSectionHelper(zip, id);
			}).then((myArray) => {
				return fs.writeJSON("./data/" + id + "/dataSet",myArray);
			}).then(() => {
				return resolve(fs.readdir("./data"));
			}).catch((err) => {
				return reject(new InsightError(err));
			});
		});
	}

	private getMoreProperties(zip: JSZip, id: string, suffix: any[]): Promise<InsightResult[]>{
		const roomHandler = new rh.default();
		let myArray: InsightResult[] = [];
		return new Promise<InsightResult[]>((resolve, reject) => {
			const asyncfunction = suffix.map((key, index) => {
				return new Promise<void>((resolve2, reject2) => {
					const href: string = key[id + "_href"].slice(2);
					zip.file(href)?.async("string").then((data) =>{
						let temp = roomHandler.findRoomTable(suffix[index], parse5.parse(data), id);
						myArray = myArray.concat(temp);
						resolve2();
					}).catch(() => {
						reject2();
					});
				});
			});
			Promise.all(asyncfunction).then(() => {
				if (myArray.length === 0){
					fs.removeSync("./data/" + id);
					return reject(new InsightError());
				}
				fs.writeJsonSync("./data/" + id + "/dataSet",myArray);
				resolve(myArray);
			});
		});
	}

	private addDatasetRoomHelper(zip: JSZip, id: string): Promise<void>{
		const roomHandler = new rh.default();
		let myArray: InsightResult[] = [];
		return new Promise<void>((resolve, reject) => {
			if (zip.file("index.htm") === null) {
				reject(new InsightError());
			}
			zip.file("index.htm")?.async("string").then((data) => {
				return roomHandler.findBuildingListTable(parse5.parse(data), id);
			}).then((suffix: any[]) => {
				return this.getMoreProperties(zip, id, suffix);
			}).then(() => {
				resolve();
			}).catch(() => {
				fs.removeSync("./data/" + id);
				reject(new InsightError());
			});
		});
	}

	private addDatasetRoom(id: string, content: string): Promise<string[]> {
		// const roomHandler = new rh.default();
		return new Promise<string[]>((resolve, reject) => {
			const idPath = "./data/" + id;
			fs.ensureDir(idPath).then(() => {
				return JSZip.loadAsync(content, {base64: true});
			}).then((zip) => {
				return this.addDatasetRoomHelper(zip, id);
			}).then(() => {
				return resolve(fs.readdir("./data"));
			}).catch((err) => {
				fs.removeSync("./data/" + id);
				return reject(new InsightError(err));
			});
		});
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!this.isIdValid(id) || this.isExisted(id)) {
			return Promise.reject(new InsightError());
		}
		if (kind === InsightDatasetKind.Sections) {
			return this.addDatasetSection(id, content);
		} else {
			return this.addDatasetRoom(id, content);
		}
	}

	public removeDataset(id: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			if (!this.isIdValid(id)) {
				return reject(new InsightError());
			}
			fs.pathExists("./data/" + id)
				.then((exits) => {
					if (!exits) {
						return reject(new NotFoundError());
					}
					fs.remove("./data/" + id).then(() => {
						return resolve(id);
					});
				})
				.catch((err) => {
					return reject(new InsightError());
				});
		});
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		const parseUtility = new pu.default("");
		const queryUtility = new qu.default();
		const parsedQuery = parseUtility.parseQuery(query);
		const path = parseUtility.getID();
		if (!fs.pathExistsSync("./data/" + path + "/dataSet")) {
			throw new InsightError();
		}
		const data = fs.readFileSync("./data/" + path + "/dataSet", "utf-8");
		let courses: any[] = JSON.parse(data);
		let insightResults: InsightResult[] = [];
		for (let course of courses) {
			if (queryUtility.handleWhere(parsedQuery, course)) {
				insightResults.push(course);
			}
		}
		if (parsedQuery.type === "notFilteredTransformed" || parsedQuery.type === "filteredTransformed"){
			insightResults = queryUtility.handleTransformation(parsedQuery["TRANSFORMATIONS"], insightResults);
		}
		queryUtility.handleOptions(parsedQuery["OPTIONS"], insightResults);
		if (insightResults.length > 5000) {
			throw new ResultTooLargeError("Too many results");
		}
		return Promise.resolve(insightResults);
	}

	private listDatasetsHelper(value: string): Promise<InsightDataset>{
		let object: InsightDataset = {id: value, kind: InsightDatasetKind.Sections, numRows: 0};
		let count = 0;
		return new Promise<InsightDataset>((resolve, reject) => {
			fs.promises.readdir("./data/" + value).then((insideFile) => {
				const asyncFunction2 = (name: string) => {
					return new Promise<void>((resolve3, reject3) => {
						fs.readFile("./data/" + value + "/" + name, "utf8").then((data) => {
							const obj = JSON.parse(data);
							const key = value + "_" + "shortname";
							if (Object.prototype.hasOwnProperty.call(obj[0], key)){
								object.kind = InsightDatasetKind.Rooms;
							}
							count += obj.length;
							resolve3();
						}).catch(() => {
							reject3();
						});
					});
				};
				const asyncOperations2 = insideFile.map(asyncFunction2);
				Promise.all(asyncOperations2).then(() => {
					object.numRows = count;
					resolve(object);
				});
			}).catch((err) => {
				reject(new InsightError(err));
			});
		});
	}

	private readAllDatasets(files: string[]): Promise<InsightDataset[]>{
		return new Promise<InsightDataset[]>((resolve, reject) => {
			const asyncOperations = files.map((value) => {
				return new Promise<InsightDataset>((resolve2, reject2) => {
					this.listDatasetsHelper(value).then((data) => {
						resolve2(data);
					});
				});
			});
			Promise.all(asyncOperations).then((final) => {
				resolve(final);
			});
		});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return new Promise<InsightDataset[]>((resolve, reject) => {
			fs.pathExists("./data").then((exits) => {
				if (!exits){
					return resolve([]);
				}
			});
			fs.promises.readdir("./data").then((files) => {
				this.readAllDatasets(files).then((final) => {
					resolve(final);
				});
			}).catch((err) => {
				reject(new InsightError(err));
			});
		});
	}
}
