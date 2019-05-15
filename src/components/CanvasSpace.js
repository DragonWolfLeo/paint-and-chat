import React from "react";
import * as api from '../api/api';

// Utility functions
// const addPositions = (arr1, arr2) => arr1.map((first, i) => first + arr2[i]);
const subPositions = (arr1, arr2) => arr1.map((first, i) => first - arr2[i]);

// Constants
const KEY = {
	SPACE: 32,
	ESC: 27,
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
		api.onReceiveCanvas((err, data) => {
			this.onReceiveCanvas(data);
		});
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
		const delta = subPositions(this.windowPosition, currentPosition);
		this.panWindow(...delta);
		this.windowPosition = currentPosition;
	}
	panWindow = (...delta) => {
		const pan = subPositions(this.panPosition, [...delta]);
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
		// const delta = event.deltaY/30;
		let delta = event.deltaY;
		if(delta > 0){
			delta = 0.1;
		} else if (delta < 0) {
			delta = -0.1;
		}
		const {currentTarget: {clientWidth, clientHeight}, clientX, clientY} = event;
		// Get distance of mouse cursor from the center
		const distance = [
			clientX - (clientWidth/2),
			clientY - (clientHeight/2),
		];
		const {zoom: prevZoom} = this.state;
		const zoom =  prevZoom - delta;
		const scaleRatio = this.getScale(zoom)/this.getScale(prevZoom);
		// Pan towards the mouse location
		const pan = distance.map((d, i) => -((d - this.panPosition[i]) * scaleRatio) + d);
		this.setState({zoom, pan},()=>this.panPosition = pan);
	}
	onScroll = event => {
		let {deltaX, deltaY} = event;
		if(deltaX > 0){
			deltaX = 1;
		} else if (deltaX < 0) {
			deltaX = -1;
		}
		if(deltaY > 0){
			deltaY = 1;
		} else if (deltaY < 0) {
			deltaY = -1;
		}
		const mult = 20;
		this.panWindow(deltaX*mult,deltaY*mult);
	}
	onKeyDown = event => {
		if(this.mouseIsPressed[MOUSE.LEFT]){
			event.preventDefault();
		}
		this.keyIsPressed[event.keyCode] = true;
		this.onKeyPress(event);
	}
	onKeyUp = event => {
		this.keyIsPressed[event.keyCode] = false;
	}
	onKeyPress = event => {
		switch(event.keyCode){
			
		}
	}
	sendCanvas = () => {
		const {drawingCanvas} = this.refs;
		const {nativeWidth, nativeHeight} = this.state;
		const nativeSize = [nativeWidth, nativeHeight];
		drawingCanvas.toBlob(blob=>{
			api.sendCanvas({blob});
			drawingCanvas.getContext("2d").clearRect(0,0, ...nativeSize);
		});
	}
	onReceiveCanvas = data => {
		if(!data){
			console.log("Error: No data received");
		}
		const ctx = this.refs.mainCanvas.getContext("2d");
		const img = document.createElement("img");
		const blob = new Blob([new Uint8Array(data.blob)], {type: "image/png"});
		const url = URL.createObjectURL(blob);
		img.onload = () => {
			// Draw onto main canvas, then delete this element
			ctx.drawImage(img,0,0);
			// TODO: Delete img element
		}
		img.src = url;
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

		// Manually add onwheel listneer as a non-passive event
		this.refs.canvasWindow.addEventListener('wheel', this.onWheel, {passive: false});
	}
	render(){
		const {nativeWidth, nativeHeight, pan} = this.state;
		const scale = this.getScale();
		return (
			<div className="canvasWindow"
				ref="canvasWindow"
				onMouseDown={this.onMouseDown}
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
					{"  "/* DEBUG: Remove this line when done */}
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