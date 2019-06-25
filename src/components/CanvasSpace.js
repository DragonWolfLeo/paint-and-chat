import React from "react";
import '../css/CanvasSpace.css';
import Toolbox from './Toolbox';
import BrushCursor from './BrushCursor';
import {eventListenerSetup} from '../util/util';

// Utility functions
// const addPositions = (arr1, arr2) => arr1.map((first, i) => first + arr2[i]);
const subPositions = (arr1, arr2) => arr1.map((first, i) => first - arr2[i]);
const colorStr = (...rgb) => { // Turns rgb array into color string
	return rgb.reduce((acc,num) => acc + num.toString(16).padStart(2,"0") , "#");
}
const absValueMax = (num, max) =>
	num > max ? max :
	num < -max ? -max :
	num;

// Constants
const KEY = Object.freeze({
	ALT: 18,
	SPACE: 32,
	ESC: 27,
	NUM_0: 48,
	S: 83,
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
	DRAW_COLOR_PICK: Symbol(),
	ERASE_COLOR_PICK: Symbol(),
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
		this.addMouseBinding(ACTIONS.ERASE, MOUSE.RIGHT);
		this.addMouseBinding(ACTIONS.DRAW_COLOR_PICK, [MOUSE.LEFT, KEY.ALT]);
		this.addMouseBinding(ACTIONS.ERASE_COLOR_PICK, [MOUSE.RIGHT, KEY.ALT]);

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
			if(this.controlActive[ACTIONS.ERASE]){
				return event=>this.onDrawLine(event, true);
			}
			return ()=>null;
		})()(event);
	}
	// Touch move
	onTouchMove = event => this.onMouseMove(event);
	onControlActivate = (control, event) => {
		switch(control){
			case ACTIONS.DRAW:
				this.deactivateControl(ACTIONS.ERASE, control);
				return this.initDrawBoundary(event);
			case ACTIONS.ERASE:
				this.deactivateControl(ACTIONS.DRAW, control);
				this.onDrawLine(event, true);
				return this.initDrawBoundary(event);
			case ACTIONS.DRAW_COLOR_PICK:
				return this.setBrushColorAtMouse(event);
			case ACTIONS.ERASE_COLOR_PICK:
				return this.setBrushColorAtMouse(event, true);
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
			case ACTIONS.ERASE:
				return drawEnd();
			default: return;
		}
	}
	deactivateControl = (control, event) => {
		// Function to manually deactivate a control
		if(this.controlActive[control]){
			this.controlActive[control] = false;
			this.onControlDeactivate(control, event);
		};
	}
	onMouseOver = event => this.mouseIsOverCanvasWindow = true;
	onMouseOut = event => this.mouseIsOverCanvasWindow = false;
	onDrawLine = (event, useAltColor) => {
		this.canvasState.dirty = true;
		const currentPosition = this.getMousePosition(event, this.refs.drawingCanvas);
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
		if(!target) target = this.refs.canvasWindow;
		const rect = target.getBoundingClientRect();
		const scale = target === this.refs.drawingCanvas ? this.getScale() : 1;
		const x = event.clientX - rect.x;
		const y = event.clientY - rect.y;
		return [x/scale, y/scale];
	}
	activateMouseBindings = (event, mouseButton) => {
		// Enable keyed bindings
		const mbind = this.keyedMouseControls[mouseButton];
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
			const mbind = this.unkeyedMouseControls[mouseButton];
			mbind && mbind.forEach(({name})=>{
				this.controlActive[name] = true;
				this.onControlActivate(name, event);
			});
		}
	}
	deactivateMouseBindings = (event, mouseButton) => {
		// Disable ALL keyed bindings
		const mbind = this.keyedMouseControls[mouseButton];
		let keyWasActive = false;
		mbind && mbind.forEach(({name, key})=>{
			this.controlActive[name] = false;
			this.keyIsPressed[key] && (keyWasActive = true);
			this.onControlDeactivate(name, event);
		});

		// If no keyed bindings were deactivated, disable unkeyed
		if(!keyWasActive){
			const mbind = this.unkeyedMouseControls[mouseButton];
			mbind && mbind.forEach(({name})=>{
				this.controlActive[name] = false;
				this.onControlDeactivate(name, event);
			});
		}

	}
	onMouseDown = event => {
		this.mousePosition = this.getMousePosition(event, this.refs.drawingCanvas);
		this.windowPosition = this.getMousePosition(event, this.refs.canvasWindow);
		this.mouseIsPressed[event.button] = true;
		this.activateMouseBindings(event, event.button);
	}
	onMouseUp = event => {
		this.mouseIsPressed[event.button] = false;
		this.deactivateMouseBindings(event, event.button);
	}
	onTouchStart = event => {
		event.preventDefault(); // Prevent mouse events
		const touchEvent = event.touches[event.which];
		// Set up listeners
		const eventListenerSetups = [];
		// Function to remove listeners
		const uninstallSetups = () => {
			eventListenerSetups.forEach(setup=>{
				setup.remove();
			})
		}
		// Touch events
		const onTouchMove = event => {
			const touch = event.touches[event.which];
			this.onTouchMove(touch);
		}
		const onTouchEnd = event => {
			uninstallSetups();
			this.onTouchEnd(event);
		}
		eventListenerSetups.push(eventListenerSetup(document.body,
			["touchmove", onTouchMove],
			["touchend", onTouchEnd],
		));
		// Add event listeners
		eventListenerSetups.forEach(setup=>{
			setup.add();
		})

		this.mousePosition = this.getMousePosition(touchEvent, this.refs.drawingCanvas);
		this.windowPosition = this.getMousePosition(touchEvent, this.refs.canvasWindow);
		this.mouseIsPressed[MOUSE.LEFT] = true;
		
		this.activateMouseBindings(touchEvent, MOUSE.LEFT);
	}
	onTouchEnd = event => {
		event.preventDefault(); // Prevent mouse events
		this.mouseIsPressed[MOUSE.LEFT] = false;
		this.deactivateMouseBindings(event, MOUSE.LEFT);
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
			case KEY.S:
					if(event.ctrlKey){
						this.saveCanvas();
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
	setBrushColor = (color, isAlt) => {
		const target = isAlt ? "brushColorAlt" : "brushColor";
		if(color !== this.state[target]){
			this.setState({[target]: color});
		}
	}
	setBrushColorAtMouse = (event, isAlt) => {
		const currentPosition = this.getMousePosition(event, this.refs.drawingCanvas);
        // Pick color from canvas
        const ctx = this.refs.mainCanvas.getContext("2d");
        const [r,g,b] = ctx.getImageData(...currentPosition,1,1).data;
		const color = colorStr(r,g,b);
		// Set color
		this.setBrushColor(color, isAlt);
	}
	initCanvas = (width, height) => {
		// Initialize main canvas
		const ctx = this.refs.mainCanvas.getContext("2d", {alpha: false});
		ctx.fillStyle="#ffffff";
		ctx.fillRect(0,0,width,height);
	}
	initDrawBoundary = event => {
		// Init boundary size
		const c = this.canvasState;
		const b = this.state.brushSize;
		const pos = this.getMousePosition(event, this.refs.drawingCanvas);
		c.minX = pos[0] - b;
		c.minY = pos[1] - b;
		c.maxX = pos[0] + b;
		c.maxY = pos[1] + b;
	}
	saveCanvas = () => {
		const {mainCanvas, bufferCanvas, saveCanvas} = this.refs;
		const {width, height} = mainCanvas;
		saveCanvas.width = width;
		saveCanvas.height = height;
		// Draw main and buffer canvas onto save canvas
		saveCanvas.getContext("2d", {alpha: false}).drawImage(mainCanvas,0,0);
		saveCanvas.getContext("2d").drawImage(bufferCanvas,0,0);
		// Create filename
		const date = new Date();
		const datestr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,"0")}-${date.getDate().toString().padStart(2,"0")}`;
		const filename = `paint-${datestr}.png`;
		// Create download
		const url = saveCanvas.toDataURL("image/png");
		const a = document.createElement("a")
        a.href = url;
		a.download = filename;
        document.body.appendChild(a);
        a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
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
			["wheel", this.onWheel, {passive: false}],
			["touchstart", this.onTouchStart, {passive: false}],
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
		const {nativeWidth, nativeHeight, pan, brushSize, brushColor, brushColorAlt} = this.state;
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
		};
		const canvasClass = scale < 2 ? "" : "pixelated";
		// Make canvas function
		const makeCanvas = ref => (
			<canvas
				className={canvasClass}
				key={ref}
				style={style}
				ref={ref} 
				width={nativeWidth} 
				height={nativeHeight}
			/>
		);
		//
		return (
			<div className="canvasWorkArea w-100 h-100 flex">
				<BrushCursor brushSize={brushSize} getMousePosition={this.getMousePosition} scale={scale}/>
				<Toolbox 
					brushSize={brushSize} 
					brushColor={brushColor} 
					brushColorAlt={brushColorAlt} 
					setBrushSize={this.setBrushSize} 
					setBrushColor={this.setBrushColor}
					saveCanvas={this.saveCanvas}
				/>
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
					{/* Invisible canvases for export data */}
					<canvas className="dn" ref="exportCanvas"/>
					<canvas className="dn" ref="saveCanvas"/>
				</div>
			</div>
		);
	}
}

export default CanvasSpace;