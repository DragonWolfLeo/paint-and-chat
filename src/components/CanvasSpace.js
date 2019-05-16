import React from "react";
import * as api from '../api/api';

// Utility functions
// const addPositions = (arr1, arr2) => arr1.map((first, i) => first + arr2[i]);
const subPositions = (arr1, arr2) => arr1.map((first, i) => first - arr2[i]);
const absValueMax = (num, max) =>
	num > max ? max :
	num < -max ? -max :
	num;


// Constants
const KEY = Object.freeze({
	SPACE: 32,
	ESC: 27,
});

const MOUSE = Object.freeze({
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2,
});

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
		// Mouse bindings
		this.addMouseBinding("PAN", [MOUSE.LEFT, KEY.SPACE], MOUSE.MIDDLE);
		this.addMouseBinding("DRAW", MOUSE.LEFT);

		// Lock binding sets as they should no longer be modified
		Object.freeze(this.keyedMouseControls);
		Object.freeze(this.unkeyedMouseControls);
	}
	mousePosition = null; // The mouse location relative to the canvas
	windowPosition = null; // The mouse location relative to the window
	panPosition = [0,0]; // The current pan, stored here to be independent of the state's asynchronous nature

	// Controls
	keyIsPressed = [];
	mouseIsPressed = [];
	controlActive = {};

	// To be used by onMouseDown and onMouseUp. Add bindings in the constructor using addMouseBinding.
	keyedMouseControls = [];
	unkeyedMouseControls = [];
	addMouseBinding = (name, ...bindings) => {
		bindings.forEach(bind => {
			let mouse, key = null;
			if(typeof(bind)==="object"){
				[mouse, key] = bind;
			} else {
				mouse = bind;
			}
			const targetControls = key !== null ? this.keyedMouseControls : this.unkeyedMouseControls;
			if(!targetControls[mouse]){
				targetControls[mouse] = [];
			}
			targetControls[mouse].push({name, key});
		});
	}

	// Events
	onMouseMove = event => {
		// Return function based on inputs
		(()=>{
			if(this.controlActive.PAN){
				return this.panCanvas;
			}
			if(this.controlActive.DRAW){
				return this.drawLine;
			}
			return ()=>null;
		})()(event);
	}
	drawLine = event => {
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
	panCanvas = event => {
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
		this.setState({pan},()=>this.panPosition = pan);
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

		// Enable keyed bindings
		const mbind = this.keyedMouseControls[event.button];
		let keyActive = false;
		mbind && mbind.forEach(({name, key})=>{
			if(this.keyIsPressed[key]){
				this.controlActive[name] = true;
				this.onControlActivate(name);
				keyActive = true;
			}
		});

		// If no keyed bindings were activated, enable unkeyed
		if(!keyActive){
			const mbind = this.unkeyedMouseControls[event.button];
			mbind && mbind.forEach(({name})=>{
				this.controlActive[name] = true;
				this.onControlActivate(name);
			});
		}
	}
	onMouseUp = event => {
		this.mouseIsPressed[event.button] = false;

		// Disable ALL keyed bindings
		const mbind = this.keyedMouseControls[event.button];
		let keyWasActive = false;
		mbind && mbind.forEach(({name, key})=>{
			this.controlActive[name] = false;
			this.keyIsPressed[key] && (keyWasActive = true);
			this.onControlDeactivate(name);
		});

		// If no keyed bindings were deactivated, disable unkeyed
		if(!keyWasActive){
			const mbind = this.unkeyedMouseControls[event.button];
			mbind && mbind.forEach(({name})=>{
				this.controlActive[name] = false;
				this.onControlDeactivate(name);
			});
		}

	}
	onControlActivate = control => {
	}
	onControlDeactivate = control => {
		switch(control){
			case "DRAW": return this.sendCanvas();
			default: return;
		}
	}
	onContextMenu = event => event.preventDefault(); // Disable context menu
	onWheel = event => {
		event.preventDefault(); // Prevent scrolling
		(event.ctrlKey ? this.zoomCanvas : this.scrollCanvas)(event); // Zoom or scroll depending if ctrl is pressed
	}
	zoomCanvas = event => {
		const max = 0.1;
		const delta = absValueMax(event.deltaY, max);
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
	scrollCanvas = event => {
		const max = 20;
		const angle = Math.atan2(event.deltaY, event.deltaX);
		const delta = [Math.cos(angle), Math.sin(angle)];
		this.panWindow(...delta.map(num=>num*max));
	}
	onKeyDown = event => {
		if(this.mouseIsPressed[MOUSE.LEFT]){
			event.preventDefault();
		}
		this.keyIsPressed[event.keyCode] = true;
		
		// Specific key binds
		switch(event.keyCode){
			case KEY.ESC:
				// Reset pan position
				const pan = [0,0];
				this.setState({pan},()=>this.panPosition = pan);
				break;
			default:
				break;
		}
	}
	onKeyUp = event => {
		this.keyIsPressed[event.keyCode] = false;
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
		const url = URL.createObjectURL(new Blob([new Uint8Array(data.blob)], {type: "image/png"}));
		img.onload = () => {
			// Draw onto main canvas
			ctx.drawImage(img,0,0);
			// Revoke url
			URL.revokeObjectURL(url);
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