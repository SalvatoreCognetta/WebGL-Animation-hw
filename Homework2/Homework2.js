"use strict";

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;
var modelViewMatrixTree;

var instanceMatrix;

var modelViewMatrixLoc;
var modelViewMatrixTreeLoc;

//Texture vars
var textures = [];
var texCoordsArray = [];

var texCoord = [
	vec2(0, 0),
	vec2(0, 1),
	vec2(1, 1),
	vec2(1, 0)
];

var vertices = [

	vec4(-0.5, -0.5, 0.5, 1.0),			//0
	vec4(-0.5, 0.5, 0.5, 1.0),			//1
	vec4(0.5, 0.5, 0.5, 1.0),				//2
	vec4(0.5, -0.5, 0.5, 1.0),			//3
	vec4(-0.5, -0.5, -0.5, 1.0),		//4
	vec4(-0.5, 0.5, -0.5, 1.0),			//5
	vec4(0.5, 0.5, -0.5, 1.0),			//6
	vec4(0.5, -0.5, -0.5, 1.0),			//7

	vec4(0.0, 0.0, 0.5, 1.0),			//8
	vec4(0.5, 0.0, 0.5, 1.0),			//9
	vec4(0.5, 0.5, 0.5, 1.0),			//10
	vec4(0.0, 0.5, 0.5, 1.0)			//11
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
var lowerArmHeight = 1.0;
var upperArmWidth = 0.5;
var lowerArmWidth = 0.5;
var upperLegWidth = 0.5;
var lowerLegWidth = 0.5;
var lowerLegHeight = 1.0;
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
var trunkId = 0;
var branch1Id = 1;
var branch2Id = 2;
var leaf1Id = 3;
var leaf2Id = 4;
var leaf3Id = 5;
var leaf4Id = 6;

var trunkHeight = 15.0;
var trunkWidth = 2.0;
var branchHeight = 4.0;
var branchWidth = 1.0;
var leafHeight = 1.0;
var leafWidth = 1.0;

var numNodesTree = 7;

var thetaTree = [0, -60, 60, -40, 40, -40, 40];


//Vertices
var numVertices = 24;

var stack = [];

var figure = [];
var figureTree = [];

for (var i = 0; i < numNodes; i++) figure[i] = createNode(null, null, null, null);

for (var i = 0; i < numNodesTree; i++) figureTree[i] = createNode(null, null, null, null);

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

function configureTexture(image, textureUnit=0) {
	var texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
       gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                    gl.NEAREST_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.uniform1i(gl.getUniformLocation(program, "uTextureMap"), textureUnit);

	textures.push(texture);
}

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

			m = translate(-9.0, -6.0, 0.0);
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

			m = translate(0.0, 0.1 * tailHeight, 0.0);
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

	gl.bindTexture(gl.TEXTURE_2D, textures[0]);

	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);

	// gl.bindTexture(gl.TEXTURE_2D, null);
}

function head() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(headWidth, headHeight, headWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));


	gl.bindTexture(gl.TEXTURE_2D, textures[1]);

	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);

	// gl.bindTexture(gl.TEXTURE_2D, null);
}

function leftUpperArm() {

	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

	gl.bindTexture(gl.TEXTURE_2D, textures[0]);

	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	// gl.bindTexture(gl.TEXTURE_2D, null);

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
	// gl.bindTexture(gl.TEXTURE_2D, null);
}

//Tree
function initNodesTree(Id) {

	var m = mat4();

	switch (Id) {

		case trunkId:

			m = translate(6.0, -10.0, 0.0);
			m = mult(m, rotate(thetaTree[trunkId], vec3(1, 0, 0)));
			figureTree[trunkId] = createNode(m, trunk, null, branch1Id);
			break;

		case branch1Id:

			m = translate(0.0, 0.8 * trunkHeight, 0.0);
			m = mult(m, rotate(thetaTree[branch1Id], vec3(0, 0, 1)));
			figureTree[branch1Id] = createNode(m, branch, branch2Id, leaf1Id);
			break;


		case branch2Id:

			m = translate(0.0, 0.7 * trunkHeight, 0.0);
			m = mult(m, rotate(thetaTree[branch2Id], vec3(0, 0, 1)));
			figureTree[branch2Id] = createNode(m, branch, null, leaf3Id);
			break;

		case leaf1Id:

			m = translate(-(0.3 * branchWidth), 0.5 * branchHeight, 0.0);
			m = mult(m, rotate(thetaTree[leaf1Id], vec3(0, 0, 1)));
			figureTree[leaf1Id] = createNode(m, leaf, leaf2Id, null);
			break;

		case leaf2Id:

			m = translate(0.3 * branchWidth, 0.5 * branchHeight, 0.0);
			m = mult(m, rotate(thetaTree[leaf2Id], vec3(0, 0, 1)));
			figureTree[leaf2Id] = createNode(m, leaf, null, null);
			break;

		case leaf3Id:

			m = translate(-0.3 * branchWidth, 0.6 * branchHeight, 0.0);
			m = mult(m, rotate(thetaTree[leaf3Id], vec3(0, 0, 1)));
			figureTree[leaf3Id] = createNode(m, leaf, leaf4Id, null);
			break;

		case leaf4Id:

			m = translate(0.3 * branchWidth, 0.5 * branchHeight, 0.0);
			m = mult(m, rotate(thetaTree[leaf4Id], vec3(0, 0, 1)));
			figureTree[leaf4Id] = createNode(m, leaf, null, null);
			break;

	}

}

function traverseTree(Id) {
	if (Id == null) return;
	stack.push(modelViewMatrix);
	modelViewMatrix = mult(modelViewMatrix, figureTree[Id].transform);
	figureTree[Id].render();
	if (figureTree[Id].child != null) traverseTree(figureTree[Id].child);
	modelViewMatrix = stack.pop();
	if (figureTree[Id].sibling != null) traverseTree(figureTree[Id].sibling);
}

function trunk() {
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * trunkHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(trunkWidth, trunkHeight, trunkWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

	gl.bindTexture(gl.TEXTURE_2D, textures[2]);

	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function branch() {
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * branchHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(branchWidth, branchHeight, branchWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

	gl.bindTexture(gl.TEXTURE_2D, textures[2]);

	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leaf() {
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * leafHeight, 0.0));
	instanceMatrix = mult(instanceMatrix, scale(leafWidth, leafHeight, leafWidth));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

	gl.bindTexture(gl.TEXTURE_2D, textures[3]);

	for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function quad(a, b, c, d) {
	pointsArray.push(vertices[a]);
	texCoordsArray.push(texCoord[0]);
	pointsArray.push(vertices[b]);
	texCoordsArray.push(texCoord[1]);
	pointsArray.push(vertices[c]);
	texCoordsArray.push(texCoord[2]);
	pointsArray.push(vertices[d]);
	texCoordsArray.push(texCoord[3]);
}


function cube() {
	//Bear
	quad(1, 0, 3, 2);
	quad(2, 3, 7, 6);
	quad(3, 0, 4, 7);
	quad(6, 5, 1, 2);
	quad(4, 5, 6, 7);
	quad(5, 4, 0, 1);

	//Tree
	quad(8, 9, 10, 11);
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
	document.getElementById("slider13").oninput = function (event) {
		thetaTree[trunkId] = event.target.value;
		initNodesTree(trunkId);
	};
}


window.onload = function init() {

	canvas = document.getElementById("gl-canvas");

	gl = canvas.getContext('webgl2');
	if (!gl) { alert("WebGL 2.0 isn't available"); }

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	gl.enable(gl.DEPTH_TEST);

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

	var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

  var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
  gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(texCoordLoc);

	var image = document.getElementById("textureTorso");
	configureTexture(image, 0);

	image = document.getElementById("textureHeadImg");
	configureTexture(image, 1);

	image = document.getElementById("textureTree");
	configureTexture(image, 2);

	image = document.getElementById("textureLeaf");
	configureTexture(image, 3);

	sliderHandler();

	for (i = 0; i < numNodes; i++) initNodes(i);

	for (i = 0; i < numNodesTree; i++) initNodesTree(i);

	render();
}


var render = function () {

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	traverse(torsoId);
	modelViewMatrix = mat4();
	stack = [];
	traverseTree(trunkId);
	requestAnimationFrame(render);
}
