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

var EPSILON = 1;

var ANGLE_ARM_PER_SEC = 20;
var ANGLE_TORSO_PER_SEC = 40;
var TRANSLATION_PER_SEC = 1.5;
var GROUND = vec3(0, -9.5, 1);
var directionArm = vec3(-1, 1, 1);
var directionLeg = vec3(-1, 1, 1);
var directionLowerLeg = vec3(-1, 1, 1);
var directionTorso = -1;
var last;

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
	vec4(0.5, 0.5, 0.5, 1.0),			//2
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
var headId = 1;
var head1Id = 1;
var leftUpperArmId = 2;
var leftLowerArmId = 3;
var rightUpperArmId = 4;
var rightLowerArmId = 5;
var leftUpperLegId = 6;
var leftLowerLegId = 7;
var rightUpperLegId = 8;
var rightLowerLegId = 9;
var tailId = 10;
var head2Id = 11;
var torso2Id = 12;
var leftUpperArm2Id = 13;
var rightUpperArm2Id = 14;
var leftUpperLeg2Id = 15;
var rightUpperLeg2Id = 16;


var torsoHeight = 5.0;
var torsoWidth = 3.0;
var upperArmHeight = 2.0;
var lowerArmHeight = 2.0;
var upperArmWidth = 1.3;
var lowerArmWidth = 1.3;
var upperLegWidth = 1.3;
var lowerLegWidth = 1.3;
var lowerLegHeight = 2.0;
var upperLegHeight = 2.0;
var headHeight = 2;
var headWidth = 1.3;
var tailHeight = 0.5;
var tailWidth = 1.0;

var torsoPosition = vec3(-9, -6, 1);

var numNodes = 11;
var numAngles = 12;
var angle = 0;

var theta = [
	90, 	//Torso: 0
	0, 		//Head : 1
	90, 	//LeftUpperArm: 2
	0, 		//LeftLowerArm: 3
	90, 	//RightUpperArm:4
	0, 		//RightLowerArm:5
	90, 	//LeftUpperLeg: 6
	0, 		//LeftLowerLeg: 7
	90, 	//RightUpperLeg:8
	0, 		//RightLowerLeg:9
	180, 	//Tail:  10
	0, 		//Head2: 11
	90,		//Torso2:12
	0,		//LeftUpperArm2Id: 13
	0,		//RightUpperArm2Id:14
	0,		//LeftUpperLeg2Id:15
	0 		//RightUpperLeg2Id:16
];


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

var treePosition = vec3(6, -10, 0);

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

function configureTexture(image, textureUnit = 0) {
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

			m = translate(torsoPosition[0], torsoPosition[1], torsoPosition[2]);
			m = mult(m, rotate(theta[torsoId], vec3(0, 1, 0)));
			m = mult(m, rotate(theta[torso2Id], vec3(1, 0, 0)));
			figure[torsoId] = createNode(m, torso, null, headId);
			break;

		case headId:
		case head1Id:
		case head2Id:

			m = translate(0.0, torsoHeight + 0.5 * headHeight, 0.0);
			m = mult(m, rotate(theta[head1Id], vec3(1, 0, 0)));
			m = mult(m, rotate(theta[head2Id], vec3(0, 1, 0)));
			m = mult(m, translate(0.0, -0.5 * headHeight, 0.0));
			figure[headId] = createNode(m, head, leftUpperArmId, null);
			break;


		case leftUpperArmId:

			m = translate(-(torsoWidth + upperArmWidth)/2, 0.9 * torsoHeight, 0.0);
			m = mult(m, rotate(theta[leftUpperArmId], vec3(1, 0, 0)));
			m = mult(m, rotate(theta[leftUpperArm2Id], vec3(0, 0, 1)));
			figure[leftUpperArmId] = createNode(m, leftUpperArm, rightUpperArmId, leftLowerArmId);
			break;

		case rightUpperArmId:

			m = translate((torsoWidth + upperArmWidth)/2, 0.9 * torsoHeight, 0.0);
			m = mult(m, rotate(theta[rightUpperArmId], vec3(1, 0, 0)));
			m = mult(m, rotate(theta[rightUpperArm2Id], vec3(0, 0, 1)));
			figure[rightUpperArmId] = createNode(m, rightUpperArm, leftUpperLegId, rightLowerArmId);
			break;

		case leftUpperLegId:

			m = translate(-(torsoWidth + upperLegWidth)/2, 0.1 * upperLegHeight, 0.0);
			m = mult(m, rotate(theta[leftUpperLegId], vec3(1, 0, 0)));
			m = mult(m, rotate(theta[leftUpperLeg2Id], vec3(0, 0, 1)));
			figure[leftUpperLegId] = createNode(m, leftUpperLeg, rightUpperLegId, leftLowerLegId);
			break;

		case rightUpperLegId:

			m = translate((torsoWidth + upperLegWidth)/2, 0.1 * upperLegHeight, 0.0);
			m = mult(m, rotate(theta[rightUpperLegId], vec3(1, 0, 0)));
			m = mult(m, rotate(theta[rightUpperLeg2Id], vec3(0, 0, 1)));
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

			m = translate(treePosition[0], treePosition[1], treePosition[2]);
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

			m = translate(-(0.3 * branchWidth), 0.5 * branchHeight, 1.0);
			m = mult(m, rotate(thetaTree[leaf1Id], vec3(0, 0, 1)));
			figureTree[leaf1Id] = createNode(m, leaf, leaf2Id, null);
			break;

		case leaf2Id:

			m = translate(0.3 * branchWidth, 0.5 * branchHeight, 0.0);
			m = mult(m, rotate(thetaTree[leaf2Id], vec3(0, 0, 1)));
			figureTree[leaf2Id] = createNode(m, leaf, null, null);
			break;

		case leaf3Id:

			m = translate(-0.3 * branchWidth, 0.6 * branchHeight, 1.0);
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

var state = [
	false,
	false,
	false,
	false,
	false
];

function animation() {
	if (!state[0]) {
		walkRight();
	} else if (!state[1]) {
		restPosition();
	} else if (!state[2]) {
		rotateBear();
	} else if (!state[3]) {
		walkBack();
	} else if (!state[4]) {
		standUp();
	} else {
		scratchBack();
	}
}

//State 1
function walkRight() {
	var now = Date.now();
	var time = now - last;
	last = now;

	var bearPosition = torsoPosition[0] + torsoHeight + headHeight;

	if (bearPosition >= treePosition[0] - trunkWidth/2) {
		state[0] = true;
	}

	var next_arm_angle = (theta[leftUpperArmId] + directionLeg[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;
	if (next_arm_angle <= 70) {
		directionLeg[0] = 1;		//Backward
	} else if (next_arm_angle >= 110) {
		directionLeg[0] = -1;	//Forward
	}

	torsoPosition[0] = torsoPosition[0] + (TRANSLATION_PER_SEC * time) / 1000.0;
	var arm_angle = theta[leftUpperArmId];
	//Conversion to rad
	arm_angle = arm_angle/90*Math.PI/2;
	var arm_length = 0.9 * (upperArmHeight + lowerArmHeight);
	torsoPosition[1] = GROUND[1] + arm_length * Math.sin(arm_angle);
	
	theta[leftUpperArmId] 	= (theta[leftUpperArmId] + directionLeg[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;
	theta[rightUpperLegId] 	= (theta[rightUpperLegId] + directionLeg[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;
	
	theta[rightUpperArmId] 	= (theta[rightUpperArmId] - directionLeg[0] * (ANGLE_ARM_PER_SEC/2 * time) / 1000.0) % 360;
	theta[leftUpperLegId] 	= (theta[leftUpperLegId] - directionLeg[0] * (ANGLE_ARM_PER_SEC/2 * time) / 1000.0) % 360;
	
	if (theta[leftUpperLegId] < 90)
		theta[leftLowerLegId] = 90 - theta[leftUpperLegId];
	if (theta[rightUpperLegId] < 90)
		theta[rightLowerLegId] = 90 - theta[rightUpperLegId];

	initNodes(torsoId);

	initNodes(leftUpperArmId);
	initNodes(rightUpperLegId);

	initNodes(rightUpperArmId);
	initNodes(leftUpperLegId);

	initNodes(leftLowerLegId);
	initNodes(rightLowerLegId);
}

//State 2: reset arm/leg position
function restPosition() {
	var now = Date.now();
	var time = now - last;
	last = now;

	var next_left_arm_angle 	= (theta[leftUpperArmId] + directionArm[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;
	var next_right_arm_angle 	= (theta[rightUpperArmId] + directionArm[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;
	var next_left_leg_angle 	= (theta[leftUpperLegId] + directionLeg[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;
	var next_right_leg_angle 	= (theta[rightUpperLegId] + directionLeg[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;
	var next_left_lower_leg_angle 	= (theta[leftLowerLegId] + directionLowerLeg[0] * (ANGLE_ARM_PER_SEC/3 * time) / 1000.0) % 360;
	var next_right_lower_leg_angle 	= (theta[rightLowerLegId] + directionLowerLeg[0] * (ANGLE_ARM_PER_SEC/3 * time) / 1000.0) % 360;
	
	var arm_angle = theta[leftUpperArmId];
	//Conversion to rad
	arm_angle = arm_angle/90*Math.PI/2;
	var arm_length = 0.9 * (upperArmHeight + lowerArmHeight);
	var l = arm_length * Math.sin(arm_angle);

	if (next_left_arm_angle < 90) {
		directionArm[0] = 1;
	} else if (next_left_arm_angle > 90) {
		directionArm[0] = -1;
	}

	if (next_left_leg_angle < 90) {
		directionLeg[0] = -1;
	} else if (next_left_leg_angle > 90) {
		directionLeg[0] = 1;
	}

	if (next_left_lower_leg_angle <= -EPSILON) {
		directionLowerLeg[0] = -1;
	} else {
		directionLowerLeg[0] = 1;
	}

	if (next_left_arm_angle >= 90 - EPSILON && next_left_arm_angle <= 90 + EPSILON) {
		if (next_right_arm_angle >= 90 - EPSILON || next_right_arm_angle <= 90 + EPSILON)
			if (next_left_leg_angle >= 90 - EPSILON && next_left_leg_angle <= 90 + EPSILON) 
				if (next_right_leg_angle >= 90 - EPSILON || next_right_leg_angle <= 90 + EPSILON)
					if (next_left_lower_leg_angle >= -EPSILON && next_left_lower_leg_angle <= EPSILON)
						if (next_right_lower_leg_angle >= -2*EPSILON && next_right_lower_leg_angle <= 2*EPSILON) 
							if (torsoPosition[1] >= GROUND[1] + l - EPSILON/3 && torsoPosition[1] <= GROUND[1] + l + EPSILON/3)
								state[1] = true;
	}

	if (next_left_arm_angle < 90 - EPSILON || next_left_arm_angle > 90 + EPSILON) {
		theta[leftUpperArmId] 	= (theta[leftUpperArmId] + directionArm[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;
	}
	if (next_right_arm_angle < 90 - EPSILON || next_right_arm_angle > 90 + EPSILON) {
		theta[rightUpperArmId] 	= (theta[rightUpperArmId] - directionArm[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;	
	}
	
	if (next_left_leg_angle < 90 - EPSILON || next_left_leg_angle > 90 + EPSILON) {
		theta[leftUpperLegId] 	= (theta[leftUpperLegId] - directionLeg[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;
	}
	if (next_right_leg_angle < 90 - EPSILON || next_right_leg_angle > 90 + EPSILON) {
		theta[rightUpperLegId] 	= (theta[rightUpperLegId] + directionLeg[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;
	}

	if (next_left_lower_leg_angle < -2*EPSILON || next_left_lower_leg_angle > 2*EPSILON) {
		var lower_direction = 1;
		if (theta[leftLowerLegId] > 0)
		lower_direction = -1;
		theta[leftLowerLegId] 	= (theta[leftLowerLegId] + lower_direction * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;
	}
	if (next_right_lower_leg_angle < -2*EPSILON || next_right_lower_leg_angle > 2*EPSILON) {
		theta[rightLowerLegId] 	= (theta[rightLowerLegId] - directionLowerLeg[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;
	}
	if (torsoPosition[1] != GROUND[1] + l) {
		torsoPosition[1] = GROUND[1] + l;
	}

	initNodes(torsoId);

	initNodes(leftUpperArmId);
	initNodes(rightUpperLegId);

	initNodes(rightUpperArmId);
	initNodes(leftUpperLegId);
	
	initNodes(leftLowerLegId);
	initNodes(rightLowerLegId);
}

//State 3
function rotateBear() {
	var now = Date.now();
	var time = now - last;
	last = now;

	var next_arm_angle = (theta[rightUpperArm2Id] + directionLeg[2] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;

	if (next_arm_angle >= 10) {
		directionLeg[2] = -1;
	} else if (next_arm_angle <= -5) {
		directionLeg[2] = 1;
	}

	var next_torso_angle = (theta[torsoId] + (ANGLE_TORSO_PER_SEC/2 * time) / 1000.0) % 360;
	if (next_torso_angle >= 270 - EPSILON && next_torso_angle <= 270 + EPSILON) {
		directionLeg[2] = 0;
		state[2] = true;
		state[1] = false; //reset leg position
	}

	torsoPosition[0] = torsoPosition[0] + (TRANSLATION_PER_SEC/10 * time) / 1000.0;

	theta[torsoId] = (theta[torsoId] + (ANGLE_TORSO_PER_SEC/2 * time) / 1000.0) % 360;

	theta[rightUpperArm2Id] = (theta[rightUpperArm2Id] + directionLeg[2] * (ANGLE_ARM_PER_SEC/2 * time) / 1000.0) % 360;
	theta[leftUpperArm2Id] = (theta[leftUpperArm2Id] - directionLeg[2] * (ANGLE_ARM_PER_SEC/2 * time) / 1000.0) % 360;

	theta[rightUpperLeg2Id] = (theta[rightUpperLeg2Id] + directionLeg[2] * (ANGLE_ARM_PER_SEC/2 * time) / 1000.0) % 360;
	theta[leftUpperLeg2Id] = (theta[leftUpperLeg2Id] - directionLeg[2] * (ANGLE_ARM_PER_SEC/2 * time) / 1000.0) % 360;

	initNodes(torsoId);

	initNodes(rightUpperArmId);
	initNodes(leftUpperArmId);

	initNodes(rightUpperLegId);
	initNodes(leftUpperLegId);
}

//State 4
function walkBack() {
	var now = Date.now();
	var time = now - last;
	last = now;
	
	var next_torso_pos = torsoPosition[0] + (TRANSLATION_PER_SEC/2 * time) / 1000.0;
	if (next_torso_pos - torsoWidth/2 > (treePosition[0] - trunkWidth)/2) {
		state[3] = true;
		state[1] = false;
	}

	var next_arm_angle = (theta[rightUpperArmId] + directionLeg[0] * (ANGLE_ARM_PER_SEC * time) / 1000.0) % 360;

	if (next_arm_angle >= 100) {
		directionLeg[0] = -1;
	} else if (next_arm_angle <= 80) {
		directionLeg[0] = 1;
	}

	torsoPosition[0] = torsoPosition[0] + (TRANSLATION_PER_SEC/2 * time) / 1000.0;
	var arm_angle = theta[leftUpperArmId];
	//Conversion to rad
	arm_angle = arm_angle/90*Math.PI/2;
	var arm_length = 0.9 * (upperArmHeight + lowerArmHeight);
	torsoPosition[1] = GROUND[1] + arm_length * Math.sin(arm_angle);
	
	theta[rightUpperArmId] = (theta[rightUpperArmId] + directionLeg[0] * (ANGLE_ARM_PER_SEC/2 * time) / 1000.0) % 360;
	theta[leftUpperArmId] = (theta[leftUpperArmId] - directionLeg[0] * (ANGLE_ARM_PER_SEC/2 * time) / 1000.0) % 360;

	theta[rightUpperLegId] = (theta[rightUpperLegId] + directionLeg[0] * (ANGLE_ARM_PER_SEC/2 * time) / 1000.0) % 360;
	theta[leftUpperLegId] = (theta[leftUpperLegId] - directionLeg[0] * (ANGLE_ARM_PER_SEC/2 * time) / 1000.0) % 360;

	initNodes(torsoId);

	initNodes(rightUpperArmId);
	initNodes(leftUpperArmId);

	initNodes(rightUpperLegId);
	initNodes(leftUpperLegId);
}

//State 5
function standUp() {
	var now = Date.now();
	var time = now - last;
	last = now;

	var angle_torso = TRANSLATION_PER_SEC * 30;

	var next_torso_angle = (theta[torso2Id] + (angle_torso/2 * time) / 1000.0) % 360;
	if (next_torso_angle >= 0 - EPSILON && next_torso_angle <= 0 + EPSILON) {
		if (torsoPosition[1] < -8.3)
			state[4] = true;
	}

	if (torsoPosition[1] >= -8.3)
		torsoPosition[1] = torsoPosition[1] - (TRANSLATION_PER_SEC/2.3 * time) / 1000.0;

	if (next_torso_angle < -EPSILON || next_torso_angle > EPSILON)
		theta[torso2Id] = (theta[torso2Id] - (angle_torso/2 * time) / 1000.0) % 360;

	theta[leftLowerLegId] 	= 90 - theta[torso2Id];
	theta[rightLowerLegId] 	= 90 - theta[torso2Id];

	initNodes(torsoId);

	initNodes(leftLowerLegId);
	initNodes(rightLowerLegId);
}

//State 6
function scratchBack() {
	var now = Date.now();
	var time = now - last;
	last = now;
	
	var next_torso_pos = torsoPosition[1] + (TRANSLATION_PER_SEC/3 * time) / 1000.0;
	if (next_torso_pos > -8) {
		directionTorso = -1;
	} else if (next_torso_pos < -8.5) {
		directionTorso = 1;
	}

	torsoPosition[1] = torsoPosition[1] + directionTorso * (TRANSLATION_PER_SEC/3 * time) / 1000.0;

	var angle_torso = TRANSLATION_PER_SEC * 15;
	theta[leftUpperLegId] = (theta[leftUpperLegId] + directionTorso * (angle_torso * time) / 1000.0) % 360;
	theta[rightUpperLegId] = (theta[rightUpperLegId] + directionTorso * (angle_torso * time) / 1000.0) % 360;


	theta[leftLowerLegId] 	= 180 - theta[leftUpperLegId];
	theta[rightLowerLegId] 	= 180 - theta[rightUpperLegId];

	initNodes(torsoId);

	initNodes(leftUpperLegId);
	initNodes(rightUpperLegId);

	initNodes(leftLowerLegId);
	initNodes(rightLowerLegId);
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

	document.getElementById("translation").oninput = function (event) {
		TRANSLATION_PER_SEC = +event.target.value;
	};
	document.getElementById("rotation-torso").oninput = function (event) {
		ANGLE_TORSO_PER_SEC = +event.target.value;
	};

	document.getElementById("reset-animation").onclick = function (event) {
		torsoPosition = vec3(-9, -6, 1);
		theta = [90,0,90,0,90,0,90,0,90,0,180,0,90,0,0,0,0];
		state[0] = false;
		state[1] = false;
		state[2] = false;
		state[3] = false;
		state[4] = false;
		directionLeg = vec3(-1, 0, 1);
		directionTorso = -1;
		for (var i = 0; i <= rightLowerLegId; i++)
			initNodes(i);
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

	last = Date.now();

	render();
}


var render = function () {

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	traverse(torsoId);
	modelViewMatrix = mat4();
	stack = [];
	traverseTree(trunkId);
	animation();
	// console.log(theta[torso2Id]);
	// console.log(theta[leftUpperLegId]);
	requestAnimationFrame(render);
}
