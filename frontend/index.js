async function onAddDataset() {
	const file = document.getElementById("dataset-file").files[0];
	const id = document.getElementById("dataset-id").value;
	const kind = document.getElementById("dataset-kind").value;
	const url = "http://localhost:4321/dataset/" + id + "/" + kind;
	console.log(url);
	const response = await fetch(url, {
		method: "PUT",
		body: file
	});
	if (response.ok) {
		alert("Dataset uploaded successfully!");
		console.log(response);
	}
	else {
		alert("ERROR UPLOADING DATASET");
	}
}

async function onRemoveDataset() {
	const id = document.getElementById("delete-dataset").value;
	const url = "http://localhost:4321/dataset/" + id;
	const response = await fetch(url, {
		method: "DELETE"
	});
	if (response.ok) {
		alert("Dataset removed successfully!");
	}
	else {
		alert("ERROR REMOVING DATASET");
	}
}

async function onQuery() {
	const query = getQuery();
	const q2 = {
		"WHERE": {
			"AND": [
				{
					"OR": [
						{
							"IS": {
								"sections_dept": "cpsc"
							}
						}
					]
				},
				{
					"GT": {
						"sections_avg": 80
					}
				}
			]
		},
		"OPTIONS": {
			"COLUMNS": [
				"sections_dept",
				"sections_id",
				"overallAvg"
			],
			"ORDER": {
				"dir": "DOWN",
				"keys": [
					"overallAvg"
				]
			}
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				"sections_dept",
				"sections_id"
			],
			"APPLY": [
				{
					"overallAvg": {
						"AVG": "sections_avg"
					}
				}
			]
		}
	}
	const url = "http://localhost:4321/query";
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(query)
	});
	if (response.ok) {
		const courses = (await response.json())["result"];
		console.log(courses);
		createTable(courses);
	}
	else {
		alert("ERROR QUERYING DATASET");
	}
}

function createTable(courses) {
	if (courses.length === 0) {
		alert("No courses match query");
		return;
	}
	let tDiv = document.getElementById("output-table");
	tDiv.innerHTML = "";
	let table = document.createElement("table");
	let allKeys = Object.keys(courses[0]);

	Object.keys(courses[0]).forEach(key => {
		let th = document.createElement("th");
		if (key.split("_")[1] === "dept") {
			th.innerHTML = "Department";
		}
		if (key.split("_")[1] === "id") {
			th.innerHTML = "ID";
		}
		if (key.split("_")[1] === "instructor") {
			th.innerHTML = "Instructor";
		}
		if (key === "overallAvg") {
			th.innerHTML = "Overall Average";
		}
		table.appendChild(th);
	});

	courses.forEach(course => {
		let tr = document.createElement("tr");
		allKeys.forEach(key => {
			let td = document.createElement("td");
			td.innerHTML = course[key];
			tr.appendChild(td);
		});
		table.appendChild(tr);
	});
	tDiv.appendChild(table);
}

function getQuery() {
	const codes = document.getElementById("query-code").value.split(",");
	const numbers = document.getElementById("query-number").value.split(",");
	const instructors = document.getElementById("query-instructor").value;
	const inequality = document.getElementById("query-inequality").value;
	const grade = document.getElementById("query-grade").value;
	let query = {};
	query["WHERE"] = {"AND": getAndBlock(codes, numbers, instructors, inequality, grade)};
	query["OPTIONS"] = getOptions(codes, numbers, instructors);
	query["TRANSFORMATIONS"] = getTransformations(codes, numbers, instructors);
	return query;
}


function getKeyNames(id) {
	return {
		"dept": id + "_dept",
		"id": id + "_id",
		"instructor": id + "_instructor",
		"avg": id + "_avg",
	}
}

function getAndBlock(codes, numbers, instructors, inequality, grade) {
	let andBlock = [];
	const keyNames = getKeyNames(document.getElementById("query-id").value);
	if (codes[0] !== "") {
		let orBlockCodes = [];
		codes.forEach(code => {
			let block = {};
			block[keyNames["dept"]] = code;
			orBlockCodes.push({"IS": block});
		});
		andBlock.push({"OR": orBlockCodes});
	}
	if (numbers[0] !== "") {
		let orBlockNumbers = [];
		numbers.forEach(number => {
			let block = {};
			block[keyNames["id"]] = number;
			orBlockNumbers.push({"IS": block});
		});
		andBlock.push({"OR": orBlockNumbers});
	}
	if (instructors !== "") {
		let orBlockInstructors = [];
		// instructors.forEach(instructor => {
		// });
		let block = {};
		block[keyNames["instructor"]] = instructors;
		orBlockInstructors.push({"IS": block});
		andBlock.push({"OR": orBlockInstructors});
	}
	if (grade !== "") {
		let block = {};
		let innerBlock = {};
		innerBlock[keyNames["avg"]] = Number(grade);
		block[inequality] = innerBlock;
		andBlock.push(block);
	}
	return andBlock;
}

function getOptions(codes, numbers, instructors) {
	let options = {};
	let columns = [];
	const keyNames = getKeyNames(document.getElementById("query-id").value);
	// if (codes[0] !== "") {
	columns.push(keyNames["dept"]);
	// }
	// if (numbers[0] !== "") {
	columns.push(keyNames["id"]);
	// }
	if (instructors !== "") {
		columns.push(keyNames["instructor"]);
	}
	columns.push("overallAvg");
	options["COLUMNS"] = columns;
	options["ORDER"] = {"dir": "DOWN", "keys": ["overallAvg"]};
	return options;
}

function getTransformations(codes, numbers, instructors) {
	let transformations = {};
	let group = [];
	const keyNames = getKeyNames(document.getElementById("query-id").value);
	// if (codes[0] !== "") {
	group.push(keyNames["dept"]);
	// }
	// if (numbers[0] !== "") {
	group.push(keyNames["id"]);
	// }
	if (instructors !== "") {
		group.push(keyNames["instructor"]);
	}
	transformations["GROUP"] = group;
	transformations["APPLY"] = [{"overallAvg": {"AVG": keyNames["avg"]}}];
	return transformations;
}
