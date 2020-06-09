"use strict";

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var vertices = [

	vec4(-0.5, -0.5, 0.5, 1.0),
	vec4(-0.5, 0.5, 0.5, 1.0),
	vec4(0.5, 0.5, 0.5, 1.0),
	vec4(0.5, -0.5, 0.5, 1.0),
	vec4(-0.5, -0.5, -0.5, 1.0),
	vec4(-0.5, 0.5, -0.5, 1.0),
	vec4(0.5, 0.5, -0.5, 1.0),
	vec4(0.5, -0.5, -0.5, 1.0)
];

//Bear
var torsoId = 0;
var torso2Id = 12;
var headId = 1;
var head1Id = 1;
var head2Id = 11;
var leftUpperArmId = 2;
var leftLowerArmId = 3;
var rightUpperArmId = 4;
var rightLowerArmId = 5;
var leftUpperLegId = 6;
var leftLowerLegId = 7;
var rightUpperLegId = 8;
var rightLowerLegId = 9;
var tailId = 10;


var torsoHeight = 5.0;
var torsoWidth = 2.0;
var upperArmHeight = 3.0;
var lowerArmHeight = 2.0;
var upperArmWidth = 0.5;
var lowerArmWidth = 0.5;
var upperLegWidth = 0.5;
var lowerLegWidth = 0.5;
var lowerLegHeight = 2.0;
var upperLegHeight = 3.0;
var headHeight = 1.5;
var headWidth = 1.0;
var tailHeight = 0.5;
var tailWidth = 0.5;

var numNodes = 11;
var numAngles = 12;
var angle = 0;

var theta = [90, 0, 90, 0, 90, 0, 90, 0, 90, 0, 180, 0, 90];


//Tree
var branchId = 0;

var branchHeight = 5.0;
var branchWidth = 2.0;

var numNodesTree = 1;

var thetaTree = [0];

//Vertices
var numVertices = 24;

var stack = [];

var figure = [];

for (var i = 0; i < numNodes; i++) figure[i] = createNode(null, null, null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];

//-------------------------------------------

function scale4(a, b, c) {
	var result = mat4();
	result[0] = a;
	result[5] = b;
	result[10] = c;
	return result;
}

//--------------------------------------------


function createNode(transform, render, sibling, child) {
	var node = {
		transform: transform,
		render: render,
		sibling: sibling,
		child: child,
	}
	return node;
}


function initNodes(Id) {

	var m = mat4();

	switch (Id) {

		case torsoId:

			m = translate(-9.0, 0.0, 0.0);
			m = mult(m, rotate(theta[torsoId], vec3(0, 1, 0)));
			m = mult(m, rotate(theta[torso2Id], vec3(1, 0, 0)));
			figure[torsoId] = createNode(m, torso, null, headId);
			break;

		case headId:
		case head1Id:
		case head2Id:

			m = translate(0.0, torsoHeight + 0.55 * headHeight, 0.0);
			m = mult(m, rotate(theta[head1Id], vec3(1, 0, 0)));
			m = mult(m, rotate(theta[head2Id], vec3(0, 1, 0)));
			m = mult(m, translate(0.0, -0.5 * headHeight, 0.0));
			figure[headId] = createNode(m, head, leftUpperArmId, null);
			break;


		case leftUpperArmId:

			m = translate(-(torsoWidth + upperArmWidth), 0.9 * torsoHeight, 0.0);
			m = mult(m, rotate(theta[leftUpperArmId], vec3(1, 0, 0)));
			figure[leftUpperArmId] = createNode(m, leftUpperArm, rightUpperArmId, leftLowerArmId);
			break;

		case rightUpperArmId:

			m = translate(torsoWidth + upperArmWidth, 0.9 * torsoHeight, 0.0);
			m = mult(m, rotate(theta[rightUpperArmId], vec3(1, 0, 0)));
			figure[rightUpperArmId] = createNode(m, rightUpperArm, leftUpperLegId, rightLowerArmId);
			break;

		case leftUpperLegId:

			m = translate(-(torsoWidth + upperLegWidth), 0.1 * upperLegHeight, 0.0);
			m = mult(m, rotate(theta[leftUpperLegId], vec3(1, 0, 0)));
			figure[leftUpperLegId] = createNode(m, leftUpperLeg, rightUpperLegId, leftLowerLegId);
			break;

		case rightUpperLegId:

			m = translate(torsoWidth + upperLegWidth, 0.1 * upperLegHeight, 0.0);
			m = mult(m, rotate(theta[rightUpperLegId], vec3(1, 0, 0)));
			figure[rightUpperLegId] = createNode(m, rightUpperLeg, tailId, rightLowerLegId);
			break;

		case tailId:

			m = translate(0.0, 0.1*tailHeight, 0.0);
			m = mult(m, rotate(theta[tailId], vec3(1, 0, 0)));
			figure[tailId] = createNode(m, tail, null, null);
			break;

		case leftLowerArmId:

			m = translate(0.0, upperArmHeight, 0.0);
			m = mult(m, rotate(theta[leftLowerArmId], vec3(1, 0, 0)));
			figure[leftLowerArmId] = createNode(m, leftLowerArm, null, null);
			break;

		case rightLowerArmId:

			m = translate(0.0, upperArmHeight, 0.0);
			m = mult(m, rotate(theta[rightLowerArmId], vec3(1, 0, 0)));
			figure[rightLowerArmId] = createNode(m, rightLowerArm, null, null);
			break;

		case leftLowerLegId:

			m = translate(0.0, upperLegHeight, 0.0);
			m = mult(m, rotate(theta[leftLowerLegId], vec3(1, 0, 0)));
			figure[leftLowerLegId] = createNode(m, leftLowerLeg, null, null);
			break;

		case rightLowerLegId:

			m = translate(0.0, upperLegHeight, 0.0);
			m = mult(m, rotate(theta[rightLowerLegId], vec3(1, 0, 0)));
			figure[rightLowerLegId] = createNode(m, rightLowerLeg, null, null);
			break;

	}

}

function traverse(Id) {

	if (Id == null) return;
	// console.log(Id);
	// console.log(Id + ": " + figure[Id].transform);
	stack.push(modelViewMatrix);
	modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
	figure[Id].render();
	if (figure[Id].child != null) traverse(figure[Id].child);
	modelViewMatrix = stack.pop();
	if (figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function torso() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * torsoHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(torsoWidth, torsoHeight, torsoWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function head() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(headWidth, headHeight, headWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftUpperArm() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftLowerArm() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightUpperArm() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightLowerArm() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftUpperLeg() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftLowerLeg() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightUpperLeg() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightLowerLeg() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth))
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function tail() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(tailWidth, tailHeight, tailWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}


function quad(a, b, c, d) {
	pointsArray.push(vertices[a]);
	pointsArray.push(vertices[b]);
	pointsArray.push(vertices[c]);
	pointsArray.push(vertices[d]);
}


function cube() {
	quad(1, 0, 3, 2);
	quad(2, 3, 7, 6);
	quad(3, 0, 4, 7);
	quad(6, 5, 1, 2);
	quad(4, 5, 6, 7);
	quad(5, 4, 0, 1);
}

function sliderHandler() {
	document.getElementById("slider0").oninput = function (event) {
		theta[torsoId] = event.target.value;
		initNodes(torsoId);
	};
	document.getElementById("slider11").oninput = function (event) {
		theta[torso2Id] = event.target.value;
		initNodes(torsoId);
	};
	document.getElementById("slider1").oninput = function (event) {
		theta[head1Id] = event.target.value;
		initNodes(head1Id);
	};

	document.getElementById("slider2").oninput = function (event) {
		theta[leftUpperArmId] = event.target.value;
		initNodes(leftUpperArmId);
	};
	document.getElementById("slider3").oninput = function (event) {
		theta[leftLowerArmId] = event.target.value;
		initNodes(leftLowerArmId);
	};

	document.getElementById("slider4").oninput = function (event) {
		theta[rightUpperArmId] = event.target.value;
		initNodes(rightUpperArmId);
	};
	document.getElementById("slider5").oninput = function (event) {
		theta[rightLowerArmId] = event.target.value;
		initNodes(rightLowerArmId);
	};
	document.getElementById("slider6").oninput = function (event) {
		theta[leftUpperLegId] = event.target.value;
		initNodes(leftUpperLegId);
	};
	document.getElementById("slider7").oninput = function (event) {
		theta[leftLowerLegId] = event.target.value;
		initNodes(leftLowerLegId);
	};
	document.getElementById("slider8").oninput = function (event) {
		theta[rightUpperLegId] = event.target.value;
		initNodes(rightUpperLegId);
	};
	document.getElementById("slider9").oninput = function (event) {
		theta[rightLowerLegId] = event.target.value;
		initNodes(rightLowerLegId);
	};
	document.getElementById("slider10").oninput = function (event) {
		theta[head2Id] = event.target.value;
		initNodes(head2Id);
	};
	document.getElementById("slider12").oninput = function (event) {
		theta[tailId] = event.target.value;
		initNodes(tailId);
	};
}


window.onload = function init() {

	canvas = document.getElementById("gl-canvas");

	gl = canvas.getContext('webgl2');
	if (!gl) { alert("WebGL 2.0 isn't available"); }

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	//
	//  Load shaders and initialize attribute buffers
	//
	program = initShaders(gl, "vertex-shader", "fragment-shader");

	gl.useProgram(program);

	instanceMatrix = mat4();

	projectionMatrix = ortho(-10.0, 10.0, -10.0, 10.0, -10.0, 10.0);
	modelViewMatrix = mat4();


	gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

	modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

	cube();

	vBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

	var positionLoc = gl.getAttribLocation(program, "aPosition");
	gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionLoc);

	sliderHandler();

	for (i = 0; i < numNodes; i++) initNodes(i);

	render();
}


var render = function () {

	gl.clear(gl.COLOR_BUFFER_BIT);
	traverse(torsoId);
	requestAnimationFrame(render);
}
