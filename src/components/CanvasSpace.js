import React from "react";

class CanvasSpace extends React.Component{
	drawing = false;
	prevPosition = null;
	onMouseMove = event => {
		if(!this.drawing) {
			return;
		} else if (!this.prevPosition) {
			this.prevPosition = this.getMousePosition(event);
		}

		const currentPosition = this.getMousePosition(event);
		const {canvas} = this.refs;
		const ctx = canvas.getContext("2d");

		// Draw a line
		ctx.fillStyle = "#000000";
		ctx.beginPath();
		ctx.moveTo(...currentPosition);
		ctx.lineTo(...this.prevPosition);
		ctx.stroke();

		// Save current position as current
		this.prevPosition = currentPosition;
	}
	getMousePosition = event => {
		// Get mouse location
		const rect = this.refs.canvas.getBoundingClientRect();
		const x = event.clientX - rect.x;
		const y = event.clientY - rect.y;
		return [x, y];
	}
	onMouseDown = event => {
		this.prevPosition = this.getMousePosition(event);
		this.drawing = true;
	}
	onMouseUp = () => {
		this.drawing = false;
	}
	componentDidMount(){
		document.body.onmousemove = this.onMouseMove;
		document.body.onmouseup = this.onMouseUp;
	}
	render(){
		return (
			<div className="canvasWindow">
				<div className="canvasSpace bg-gray">
					<canvas 
						ref="canvas" 
						width={400} 
						height={400} 
						onMouseDown={this.onMouseDown} 
					/>
				</div>
			</div>
		);
	}
}

export default CanvasSpace;