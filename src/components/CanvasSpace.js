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

		const {canvas} = this.refs;
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#000000";
		const currentPosition = this.getMousePosition(event);
		ctx.beginPath();
		ctx.moveTo(...currentPosition);
		ctx.lineTo(...this.prevPosition);
		ctx.stroke();

		this.prevPosition = currentPosition;
		// console.log(`x: ${x}; y: ${y}`)
	}
	onMouseOver = event => {
		this.prevPosition = this.getMousePosition(event);
	}
	getMousePosition = event => {
		// Get mouse location
		const rect = event.target.getBoundingClientRect();
		const x = Math.round(event.clientX - rect.x);
		const y = Math.round(event.clientY - rect.y);
		return [x, y];
	}
	onClick = event => {
		this.prevPosition = this.getMousePosition(event);
		this.drawing = true;
	}
	onMouseUp = () => {
		this.drawing = false;
	}
	componentDidMount(){
		// const {canvas} = this.refs;
		// const ctx = canvas.getContext("2d");
		// ctx.fillStyle = "#FF0000";
		// ctx.fillRect(0, 0, 80, 80);
	}
	render(){
		return (
			<div className="canvasSpace bg-gray flex items-center justify-center">
				<canvas 
					ref="canvas" 
					width={400} 
					height={400} 
					onMouseDown={this.onClick} 
					onMouseUp={this.onMouseUp} 
					onMouseMove={this.onMouseMove}
					onMouseOver={this.onMouseOver}
				/>
			</div>
		);
	}
}

export default CanvasSpace;