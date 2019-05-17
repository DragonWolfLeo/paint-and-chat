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
	NUM_0: 48,
});

const MOUSE = Object.freeze({
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2,
});

const ACTIONS = Object.freeze({
	PAN: Symbol(),
	DRAW: Symbol(),
	ERASE: Symbol(),
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
		this.addMouseBinding(ACTIONS.PAN, [MOUSE.LEFT, KEY.SPACE], MOUSE.MIDDLE);
		this.addMouseBinding(ACTIONS.DRAW, MOUSE.LEFT);

		// Lock binding sets as they should no longer be modified
		Object.freeze(this.keyedMouseControls);
		Object.freeze(this.unkeyedMouseControls);
	}
	mouseIsOverCanvasWindow = false; // Updated onMouseMove
	mousePosition = null; // The mouse location relative to the canvas
	windowPosition = null; // The mouse location relative to the window
	panPosition = [0,0]; // The current pan, stored here to be independent of the state's asynchronous nature
	drawingDirty = false;

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
			if(this.controlActive[ACTIONS.PAN]){
				return this.onPan;
			}
			if(this.controlActive[ACTIONS.DRAW]){
				return this.onDrawLine;
			}
			return ()=>null;
		})()(event);
	}
	onMouseOver = event => this.mouseIsOverCanvasWindow = true;
	onMouseOut = event => this.mouseIsOverCanvasWindow = false;
	onDrawLine = event => {
		this.drawingDirty = true;
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
			case ACTIONS.DRAW:
				if(this.drawingDirty){
					this.drawingDirty = false;
					this.sendCanvas();
				}
				return;
			default: return;
		}
	}
	onContextMenu = event => event.preventDefault(); // Disable context menu
	onWheel = event => {
		event.preventDefault(); // Prevent scrolling
		(event.ctrlKey ? this.onZoom : this.onScroll)(event); // Zoom or scroll depending if ctrl is pressed
	}
	onZoom = event => {
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
	onScroll = event => {
		const max = 20;
		const angle = Math.atan2(event.deltaY, event.deltaX);
		const delta = [Math.cos(angle), Math.sin(angle)];
		this.panWindow(...delta.map(num=>num*max));
	}
	onKeyDown = event => {
		this.keyIsPressed[event.keyCode] = true;
		console.log(event.target);
		// Specific key binds
		let preventDefault = true;
		switch(event.keyCode){
			case KEY.ESC:
				// Reset pan position
				const pan = [0,0];
				this.setState({pan},()=>this.panPosition = pan);
				break;
			case KEY.SPACE:
				// Used by PAN
				break;
			case KEY.NUM_0:
				// Reset zoom
				if(event.ctrlKey && this.mouseIsOverCanvasWindow){
					this.setState({zoom: 0});
				} else {
					preventDefault = false;
				}
				break;
			default:
				preventDefault = false;
				break;
		}
		preventDefault && event.preventDefault();
	}
	onKeyUp = event => {
		this.keyIsPressed[event.keyCode] = false;
	}
	sendCanvas = () => {
		const {drawingCanvas, bufferCanvas} = this.refs;
		const {nativeWidth, nativeHeight} = this.state;
		drawingCanvas.toBlob(blob=>{
			api.sendCanvas({blob});
			// Move drawn art to buffer canvas
			bufferCanvas.getContext("2d").drawImage(drawingCanvas,0,0);
			drawingCanvas.getContext("2d").clearRect(0,0,nativeWidth, nativeHeight);
		});
	}
	onReceiveCanvas = data => {
		if(!data){
			console.log("Error: No data received");
		}
		const {mainCanvas, bufferCanvas} = this.refs;
		const {nativeWidth, nativeHeight} = this.state;
		const img = document.createElement("img");
		const url = URL.createObjectURL(new Blob([new Uint8Array(data.blob)], {type: "image/png"}));
		img.onload = () => {
			// Draw onto main canvas
			mainCanvas.getContext("2d").drawImage(img,0,0);
			// Clear buffer canvas
			bufferCanvas.getContext("2d").clearRect(0,0,nativeWidth, nativeHeight);
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

		// Initialize main canvas
		const ctx = this.refs.mainCanvas.getContext("2d", {alpha: false});
		ctx.fillStyle="#ffffff";
		ctx.fillRect(0,0,this.state.nativeWidth,this.state.nativeHeight);
	}
	render(){
		const {nativeWidth, nativeHeight, pan} = this.state;
		const scale = this.getScale();
		// Set up canvas style (organized to reduce math)
		const style = {
			width: Math.round(nativeWidth * scale),
			height: Math.round(nativeHeight * scale),
			position: "absolute",
			imageRendering: scale < 2 ? "auto" : "crisp-edges",
		};
		Object.assign(style, {
			left: -style.width/2,
			top: -style.height/2,
		});
		// Make canvas function
		const makeCanvas = ref => (
			<canvas 
				key={ref}
				style={style}
				ref={ref} 
				width={nativeWidth} 
				height={nativeHeight}
			/>
		);
		//
		return (
			<div className="canvasWindow"
				ref="canvasWindow"
				onMouseDown={this.onMouseDown}
				onContextMenu={this.onContextMenu}
				onMouseOver={this.onMouseOver}
				onMouseOut={this.onMouseOut}
			>
				<div className="canvasSpace"
					ref="canvasSpace"
					style={{
						transform: `translate(${pan[0]}px,${pan[1]}px)`,
						position: "relative",
					}}
				>
					{[
						"mainCanvas",
						"bufferCanvas",
						"drawingCanvas",
					].map(makeCanvas)}
				</div>
			</div>
		);
	}
}

export default CanvasSpace;