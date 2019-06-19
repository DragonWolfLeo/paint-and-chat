import React from "react";
import '../css/CanvasSpace.css';
import Toolbox from './Toolbox';
import {eventListenerSetup} from '../util/util';

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
	DRAW_ALT: Symbol(),
	ERASE: Symbol(),
});

const STARTING_CHAT_WIDTH = 350;

class CanvasSpace extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			nativeWidth: 0,
			nativeHeight: 0,
			zoom: 0,
			pan: this.getResetChatWidth(),
			brushSize: 4,
			brushColor: "#000000",
			brushColorAlt: "#ffffff",
		}
		this.panPosition = [...this.state.pan];
		// Mouse bindings; 
		this.addMouseBinding(ACTIONS.PAN, [MOUSE.LEFT, KEY.SPACE], MOUSE.MIDDLE);
		this.addMouseBinding(ACTIONS.DRAW, MOUSE.LEFT);
		this.addMouseBinding(ACTIONS.DRAW_ALT, MOUSE.RIGHT);

		// Lock binding sets as they should no longer be modified
		Object.freeze(this.keyedMouseControls);
		Object.freeze(this.unkeyedMouseControls);
	}
	mouseIsOverCanvasWindow = false; // Updated onMouseMove
	mousePosition = null; // The mouse location relative to the canvas
	windowPosition = null; // The mouse location relative to the window
	panPosition = null; // The current pan, stored here to be independent of the state's asynchronous nature
	canvasState = {
		dirty: false,
		minX: 0,
		maxX: 0,
		minY: 0,
		maxY: 0,
	}
	chatWidth = STARTING_CHAT_WIDTH;

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
			if(this.controlActive[ACTIONS.DRAW_ALT]){
				return event=>this.onDrawLine(event, true);
			}
			return ()=>null;
		})()(event);
	}
	onControlActivate = (control, event) => {
		switch(control){
			case ACTIONS.DRAW:
				// Init boundary size
				const c = this.canvasState;
				const pos = this.getMousePosition(event, this.refs.drawingCanvas);
				[c.minX, c.minY] = pos;
				[c.maxX, c.maxY] = pos;
				return;
			default: return;
		}
	}
	onControlDeactivate = (control, event) => {
		const drawEnd = () => {
			if(this.canvasState.dirty){
				this.canvasState.dirty = false;
				this.sendCanvas();
			}
		}
		switch(control){
			case ACTIONS.DRAW:
				return drawEnd();
			case ACTIONS.DRAW_ALT:
				return drawEnd();
			default: return;
		}
	}
	onMouseOver = event => this.mouseIsOverCanvasWindow = true;
	onMouseOut = event => this.mouseIsOverCanvasWindow = false;
	onDrawLine = (event, useAltColor) => {
		this.canvasState.dirty = true;
		const currentPosition = this.getMousePosition(event, this.refs.drawingCanvas)
		if (!this.mousePosition) {
			// Save previous position
			this.mousePosition = currentPosition;
			return;
		}
		const ctx = this.refs.drawingCanvas.getContext("2d");
		// Expand export boundary
		const c = this.canvasState;
		c.minX = Math.min(c.minX, currentPosition[0]);
		c.maxX = Math.max(c.maxX, currentPosition[0]);
		c.minY = Math.min(c.minY, currentPosition[1]);
		c.maxY = Math.max(c.maxY, currentPosition[1]);

		// Draw a line
		const {brushSize, brushColor, brushColorAlt} = this.state;
		ctx.strokeStyle = useAltColor ? brushColorAlt : brushColor;
		ctx.lineWidth = brushSize;
		ctx.lineCap = "round";
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
				this.onControlActivate(name, event);
				keyActive = true;
			}
		});

		// If no keyed bindings were activated, enable unkeyed
		if(!keyActive){
			const mbind = this.unkeyedMouseControls[event.button];
			mbind && mbind.forEach(({name})=>{
				this.controlActive[name] = true;
				this.onControlActivate(name, event);
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
			this.onControlDeactivate(name, event);
		});

		// If no keyed bindings were deactivated, disable unkeyed
		if(!keyWasActive){
			const mbind = this.unkeyedMouseControls[event.button];
			mbind && mbind.forEach(({name})=>{
				this.controlActive[name] = false;
				this.onControlDeactivate(name, event);
			});
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
	resetPanAndZoom = () => {
		// Reset pan position and zoom
		const pan = this.getResetChatWidth();
		this.setState({pan, zoom: 0},()=>this.panPosition = pan);
	}
	onKeyDown = event => {
		if(event.target !== event.currentTarget){
			// Cancel event if an input field is selected
			return;
		}
		this.keyIsPressed[event.keyCode] = true;
		// Specific key binds
		let preventDefault = true;
		switch(event.keyCode){
			case KEY.ESC:
				this.resetPanAndZoom();
				break;
			case KEY.SPACE:
				// Used by PAN
				break;
			case KEY.NUM_0:
				if(event.ctrlKey && this.mouseIsOverCanvasWindow){
					this.resetPanAndZoom();
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
		const {drawingCanvas, bufferCanvas, exportCanvas} = this.refs;
		const {nativeWidth, nativeHeight, brushSize} = this.state;
		let {minX, maxX, minY, maxY} = this.canvasState;
		// Clamp to canvas boundaries
		const bleed = 3 + brushSize;
		minX = Math.floor(Math.max(minX-bleed, 0));
		maxX = Math.ceil(Math.min(maxX+bleed, nativeWidth));
		minY = Math.floor(Math.max(minY-bleed, 0));
		maxY = Math.ceil(Math.min(maxY+bleed, nativeHeight));
		// Resize to minimum
		const width = maxX - minX;
		const height = maxY - minY;
 		// Check if size is valid
		if(width <= 0 || height <= 0) return;
		// Draw on exportCanvas
		exportCanvas.width = width;
		exportCanvas.height = height;
		const eCtx = exportCanvas.getContext("2d");
		eCtx.clearRect(0,0,exportCanvas.width,exportCanvas.height);
		eCtx.drawImage(drawingCanvas,minX,minY,width,height,0,0,width,height);
		// Convert exportCanvas to blob
		exportCanvas.toBlob(blob=>{
			this.props.connection.sendCanvas({
				blob,
				x: minX,
				y: minY,
				width,
				height,
			});
			// Move drawn art to buffer canvas
			bufferCanvas.getContext("2d").drawImage(drawingCanvas,0,0);
			drawingCanvas.getContext("2d").clearRect(0,0,nativeWidth, nativeHeight);
		});
	}
	onReceiveCanvas = data => {
		if(!data){
			return console.error("Error: No data received");
		}
		const {buffer, x, y, width, height, setWidth, setHeight} = data;
		// Check if resize is emitted
		if(setWidth && setHeight){
			this.setState({nativeWidth: setWidth, nativeHeight: setHeight}, ()=>{
				this.initCanvas(setWidth,setHeight);
				this.onReceiveCanvas({buffer,x,y,width,height})
			});
			return;
		}
		const {mainCanvas, bufferCanvas} = this.refs;
		const {nativeWidth, nativeHeight} = this.state;
		const img = document.createElement("img");
		const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], {type: "image/png"}));
		img.onload = () => {
			// Draw onto main canvas
			mainCanvas.getContext("2d", {alpha: false}).drawImage(img, 0, 0, width, height, x, y, width, height);
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
	getResetChatWidth = () => {
		return [-this.chatWidth/2, 0];
	}
	setBrushSize = size => {
		if(size !== this.state.brushSize)
			this.setState({brushSize: size});
	}
	initCanvas = (width, height) => {
		// Initialize main canvas
		const ctx = this.refs.mainCanvas.getContext("2d", {alpha: false});
		ctx.fillStyle="#ffffff";
		ctx.fillRect(0,0,width,height);
	}
	// Lifecycle hooks
	componentDidMount(){
		// Get event listener setup functions
		const eventListenerSetups = [];
		eventListenerSetups.push(eventListenerSetup(document.body,
			["mousemove", this.onMouseMove],
			["mouseup", this.onMouseUp],
			["keydown", this.onKeyDown],
			["keyup", this.onKeyUp],
		));
		eventListenerSetups.push(eventListenerSetup(this.refs.canvasWindow, 
			["wheel", this.onWheel, {passive: false}]
		));
		eventListenerSetups.push(this.props.connection.onCanvasSetup(this.onReceiveCanvas));
		// Add event listeners
		eventListenerSetups.forEach(setup=>{
			setup.add();
		})
		// Store event listeners to be removed on unmount
		this.eventListenerSetups = eventListenerSetups;
	}
	componentWillUnmount(){
		const {eventListenerSetups} = this;
		if(eventListenerSetups){
			eventListenerSetups.forEach(setup=>{
				setup.remove();
			})
		}
	}
	render(){
		const {nativeWidth, nativeHeight, pan, brushSize, brushColor} = this.state;
		const scale = this.getScale();
		// Set up canvas style
		const width = Math.round(nativeWidth * scale);
		const height = Math.round(nativeHeight * scale);
		const style = {
			width,
			height,
			left: -width/2,
			top: -height/2,
			position: "absolute",
			imageRendering: scale < 2 ? "auto" : "crisp-edges",
		};
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
			<div className="w-100 h-100 flex">
				<Toolbox brushSize={brushSize} brushColor={brushColor} setBrushSize={this.setBrushSize}/>
				<div className="canvasSpaceContainer"
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
						}}
					>
						{[
							"mainCanvas",
							"bufferCanvas",
							"drawingCanvas",
						].map(makeCanvas)}
					</div>
					{/* Invisible canvas for export data */}
					<canvas className="dn" ref="exportCanvas"/>
				</div>
			</div>
		);
	}
}

export default CanvasSpace;