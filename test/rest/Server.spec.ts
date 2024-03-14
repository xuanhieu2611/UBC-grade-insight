import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";

import {expect} from "chai";
import request, {Response} from "supertest";
import * as fs from "fs-extra";
import {clearDisk} from "../TestUtil";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;
	let SERVER_URL: string;

	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		server.start();
		SERVER_URL = "http://localhost:4321";
	});

	after(function () {
		// TODO: stop server here once!
		clearDisk();
		server.stop();
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	// Sample on how to format PUT requests
	// it("PUT test for courses dataset", function () {
	// 	try {
	// 		return request(SERVER_URL)
	// 			.put("/dataset/ubc/sections")
	// 			.send(fs.readFileSync("test/resources/archives/small.zip"))
	// 			.set("Content-Type", "application/x-zip-compressed")
	// 			.then(function (res: Response) {
	// 				// some logging here please!
	// 				expect(res.status).to.be.equal(200);
	// 			})
	// 			.catch(function (err) {
	// 				// some logging here please!
	// 				console.log(err);
	// 				expect.fail();
	// 			});
	// 	} catch (err) {
	// 		// and some more logging here!
	// 		console.log(err);
	// 		expect.fail();
	// 	}
	// });

	it("DELETE test for courses dataset", function () {
		try {
			return request(SERVER_URL)
				.delete("/dataset/nonexist")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(404);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
			expect.fail();
		}
	});

	// it("PUT wrong kind", function () {
	// 	try {
	// 		return request(SERVER_URL)
	// 			.put("/dataset/ubc/rooms")
	// 			.send(fs.readFileSync("test/resources/archives/small.zip"))
	// 			.set("Content-Type", "application/x-zip-compressed")
	// 			.then(function (res: Response) {
	// 				// some logging here please!
	// 				expect(res.status).to.be.equal(400);
	// 			})
	// 			.catch(function (err) {
	// 				// some logging here please!
	// 				console.log(err);
	// 				expect.fail();
	// 			});
	// 	} catch (err) {
	// 		// and some more logging here!
	// 		console.log(err);
	// 		expect.fail();
	// 	}
	// });

	it("PUT correct kind", function () {
		try {
			return request(SERVER_URL)
				.put("/dataset/ubc/sections")
				.send(fs.readFileSync("test/resources/archives/small.zip"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
			expect.fail();
		}
	});

	it("POST invalid query", function () {
		try {
			return request(SERVER_URL)
				.post("/query")
				.send({
					WHERE: {
					  	GT: {
							sections_avg: 105
					  	}
					},
					OPTIONS: {
					  	COLUMNS: [
							"sections_dept",
							"sections_avg"
					  	],
					  	ORDER: "sections_avg"
					}
				}).then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
			expect.fail();
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions at the supertest documentation
});
