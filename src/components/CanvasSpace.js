import React from "react";
import * as api from '../api/api';

// Utility functions
const addPositions = (arr1, arr2) => arr1.map((first, i) => first + arr2[i]);
const subPositions = (arr1, arr2) => arr1.map((first, i) => first - arr2[i]);

// Constants
const KEY = {
	SPACE: 32,
};

const MOUSE = {
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2,
};

class CanvasSpace extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			nativeWidth: 400,
			nativeHeight: 400,
			zoom: 0,
			pan: [0,0],
		}
	}
	mouseDown = false;
	mousePosition = null;
	windowPosition = null;
	panPosition = [0,0];
	keyIsPressed = [];
	mouseIsPressed = [];

	// Events
	onMouseMove = event => {
		// Return function based on inputs
		(()=>{
			if(this.keyIsPressed[KEY.SPACE] && this.mouseIsPressed[MOUSE.LEFT]){
				return this.onPan;
			}
			if(this.mouseIsPressed[MOUSE.LEFT]){
				return this.onDrawLine;
			}
			if(this.mouseIsPressed[MOUSE.MIDDLE]){
				return this.onPan;
			}
			return ()=>null;
		})()(event);
	}
	onDrawLine = event => {
		const currentPosition = this.getMousePosition(event, this.refs.drawingCanvas)
		if (!this.mousePosition) {
			// Save previous position
			this.mousePosition = currentPosition;
			return;
		}
		const ctx = this.refs.drawingCanvas.getContext("2d");

		// Draw a line
		ctx.fillStyle = "#000000";
		ctx.beginPath();
		ctx.moveTo(...currentPosition);
		ctx.lineTo(...this.mousePosition);
		ctx.stroke();

		// // Save current position as current
		this.mousePosition = currentPosition;
	}
	onPan = event => {
		const currentPosition = this.getMousePosition(event, this.refs.canvasWindow)
		if (!this.windowPosition) {
			// Save previous position
			this.windowPosition = currentPosition;
			return;
		}
		const delta = subPositions(currentPosition, this.windowPosition);
		this.panWindow(...delta);
		this.windowPosition = currentPosition;
	}
	panWindow = (...delta) => {
		const pan = addPositions(this.panPosition, [...delta]);
		this.setState({
			pan,
		},()=>{
			this.panPosition = pan;
		});
	}
	getMousePosition = (event, target) => {
		// Get mouse location
		const rect = target.getBoundingClientRect();
		const scale = target === this.refs.drawingCanvas ? this.getScale() : 1;
		const x = event.clientX - rect.x;
		const y = event.clientY - rect.y;
		return [x/scale, y/scale];
	}
	onMouseDown = event => {
		this.mousePosition = this.getMousePosition(event, this.refs.drawingCanvas);
		this.windowPosition = this.getMousePosition(event, this.refs.canvasWindow);
		this.mouseIsPressed[event.button] = true;
	}
	onMouseUp = event => {
		this.mouseIsPressed[event.button] = false;
		this.sendCanvas();
	}
	onContextMenu = event => event.preventDefault(); // Disable context menu
	onWheel = event => {
		event.preventDefault(); // Prevent scrolling
		(event.ctrlKey ? this.onZoom : this.onScroll)(event);
	}
	onZoom = event => {
		const delta = event.deltaY/30;
		const {currentTarget: {clientWidth, clientHeight}, clientX, clientY} = event;
		// Get distance of mouse cursor from the center
		const distance = [
			clientX - (clientWidth/2),
			clientY - (clientHeight/2),
		];
		const {zoom: prevZoom} = this.state;
		const zoom =  prevZoom + delta;
		const scaleRatio = this.getScale(zoom)/this.getScale(prevZoom);
		// Pan towards the mouse location
		const pan = distance.map((d, i) => -((d - this.panPosition[i]) * scaleRatio) + d);
		this.setState({zoom, pan},()=>this.panPosition = pan);
	}
	onScroll = event => {
		const mult = 15;
		this.panWindow(event.deltaX*mult, event.deltaY*mult);
	}
	onKeyDown = event => {
		if(this.mouseIsPressed[MOUSE.LEFT]){
			event.preventDefault();
		}
		this.keyIsPressed[event.keyCode] = true;
	}
	onKeyUp = event => {
		this.keyIsPressed[event.keyCode] = false;
	}
	sendCanvas = () => {
		const {drawingCanvas, mainCanvas} = this.refs;
		const {nativeWidth, nativeHeight} = this.state;
		const ctx_main = mainCanvas.getContext("2d");
		const ctx_drawing = drawingCanvas.getContext("2d");
		ctx_main.drawImage(drawingCanvas, 0, 0);
		ctx_drawing.clearRect(0,0, nativeWidth, nativeHeight);
	}
	// Other functions
	getScale = zoom => {
		return 2**(zoom || this.state.zoom);
	}
	// Lifecycle hooks
	componentDidMount(){
		document.body.onmousemove = this.onMouseMove;
		document.body.onmouseup = this.onMouseUp;
		document.body.onkeydown = this.onKeyDown;
		document.body.onkeyup = this.onKeyUp;
	}
	render(){
		const {nativeWidth, nativeHeight, pan} = this.state;
		const scale = this.getScale();
		return (
			<div className="canvasWindow"
				ref="canvasWindow"
				onMouseDown={this.onMouseDown}
				onWheel={this.onWheel}		
				onContextMenu={this.onContextMenu}
			>
				<div className="canvasSpace"
					ref="canvasSpace"
					style={{
						transform: `translate(${pan[0]}px,${pan[1]}px)`,
						position: "relative",
					}}
				>
					<canvas 
						style={{
							width: nativeWidth * scale,
							height: nativeHeight * scale,
						}}
						ref="mainCanvas" 
						width={nativeWidth} 
						height={nativeHeight}
					/>
					{"  "}
					<canvas 
					style={{
						width: nativeWidth * scale,
						height: nativeHeight * scale,
						position: "absolute",
						top: 0,
						left: 0,
					}}
					ref="drawingCanvas" 
					width={nativeWidth} 
					height={nativeHeight}
				/>
				</div>
			</div>
		);
	}
}

export default CanvasSpace;