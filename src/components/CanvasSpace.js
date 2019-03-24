import React from "react";

// Utility functions
const addPositions = (arr1, arr2) => arr1.map((first, i) => first + arr2[i]);
const subPositions = (arr1, arr2) => arr1.map((first, i) => first - arr2[i]);

// Constants
const KEY = {};
KEY.SPACE = 32;

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
	canvasPosition = null;
	windowPosition = null;
	panPosition = [0,0];
	keyIsPressed = [];
	// Events
	onMouseMove = event => {
		if(!this.mouseDown) {
			return;
		}
		// Pan or draw line
		(this.keyIsPressed[KEY.SPACE] ? this.onPan : this.onDrawLine)(event);
	}
	onDrawLine = event => {
		const currentPosition = this.getMousePosition(event, this.refs.canvas)
		if (!this.canvasPosition) {
			// Save previous position
			this.canvasPosition = currentPosition;
			return;
		}
		const {canvas} = this.refs;
		const ctx = canvas.getContext("2d");

		// Draw a line
		ctx.fillStyle = "#000000";
		ctx.beginPath();
		ctx.moveTo(...currentPosition);
		ctx.lineTo(...this.canvasPosition);
		ctx.stroke();

		// // Save current position as current
		this.canvasPosition = currentPosition;
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
		this.setState({pan},()=>this.panPosition = pan);
	}
	getMousePosition = (event, target) => {
		// Get mouse location
		const rect = target.getBoundingClientRect();
		const scale = target === this.refs.canvas ? this.getScale() : 1;
		const x = event.clientX - rect.x;
		const y = event.clientY - rect.y;
		return [x/scale, y/scale];
	}
	onMouseDown = event => {
		this.canvasPosition = this.getMousePosition(event, this.refs.canvas);
		this.windowPosition = this.getMousePosition(event, this.refs.canvasWindow);
		this.mouseDown = true;
	}
	onMouseUp = () => {
		this.mouseDown = false;
	}
	onWheel = event => {
		event.preventDefault(); // Prevent scrolling
		(event.ctrlKey ? this.onZoom : this.onScroll)(event);
	}
	onZoom = event => {
		const delta = event.deltaY/30;
		this.setState(prevState=>{
			return {zoom: prevState.zoom + delta}
		})
	
		// TODO: Get window to scroll towards the position of the mouse
		// const e = {...event};
		// // console.log(e.clientX/e.currentTarget.clientWidth)
		// // console.log(e);
		// // console.log(e.clientX, e.clientY, e.currentTarget.scrollLeftMax, e.currentTarget.scrollTopMax);
		// const {currentTarget: target} = e;
		// target.scrollLeft = target.scrollLeftMax*(e.clientX/e.currentTarget.clientWidth);
		// target.scrollTop = target.scrollTopMax*(e.clientY/e.currentTarget.clientHeight);
	}
	onScroll = event => {
		const mult = 15;
		this.panWindow(event.deltaX*mult, event.deltaY*mult);
	}
	onKeyDown = event => {
		if(this.mouseDown){
			event.preventDefault();
		}
		this.keyIsPressed[event.keyCode] = true;
	}
	onKeyUp = event => {
		this.keyIsPressed[event.keyCode] = false;
	}
	// Lifecycle hooks
	componentDidMount(){
		document.body.onmousemove = this.onMouseMove;
		document.body.onmouseup = this.onMouseUp;
		document.body.onkeydown = this.onKeyDown;
		document.body.onkeyup = this.onKeyUp;

		const {canvasSpace} = this.refs;
		console.log(canvasSpace.clientHeight);
	}
	// Other functions
	getScale = () => {
		return 2**this.state.zoom;
	}
	render(){
		const {nativeWidth, nativeHeight, pan} = this.state;
		const scale = this.getScale();
		return (
			<div className="canvasWindow"
				ref="canvasWindow"
				onMouseDown={this.onMouseDown}
				onWheel={this.onWheel}		
			>
				<div className="canvasSpace bg-gray"
					ref="canvasSpace"
					style={{
						transform: `translate(${pan[0]}px,${pan[1]}px)`,
					}}
				>
					<canvas 
						style={{
							width: nativeWidth * scale,
							height: nativeHeight * scale,
						}}
						ref="canvas" 
						width={nativeWidth} 
						height={nativeHeight} 
					/>
				</div>
			</div>
		);
	}
}

export default CanvasSpace;