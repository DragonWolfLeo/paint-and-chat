import React from "react";
import '../css/Toolbox.css'
import Palette from "./Palette";
import {MIN_BRUSH_SIZE, MAX_BRUSH_SIZE} from '../constants';

const BRUSH_SIZES = Object.freeze([24, 16, 12, 8, 4]);

class Toolbox extends React.Component {
	// Setting the brush size number input
	onSizeInputChange = event => {
		const {target} = event;
		let value = Number(target.value);
		if(!target.checkValidity()) {
			 // Check if this is a number; return if not
			if(!value) return;
			// Clamp within range if invalid
			const min = Number(target.min);
			const max = Number(target.max);
			value = value > max ? max : min;
		}
		this.props.setBrushSize(value);
	}
	// Losing focus on brush input
	onSizeInputBlur = event => {
		// Revert to current brush size
		if(!event.target.checkValidity())
			return this.updateInputBrushSize();
	}
	// Selecting a brush size button
	onBrushSizeButton = size => {
		this.updateInputBrushSize(size);
		this.props.setBrushSize(size);
	}
	// Set the value of the brush size number input
	updateInputBrushSize = size => this.refs.sizeInput.value = size || this.props.brushSize;
	// Setting the brush color input
	onSetBrushColor = isAlt => event => this.props.setBrushColor(event.target.value, isAlt);
	// Selecting a brush color from the palette
	choosePaletteColor = (color, isAlt) => this.props.setBrushColor(color, isAlt);
	// Lifecycle hooks
	componentDidMount(){
		// Set initial values of input
		this.updateInputBrushSize();
	}
	render(){
		const {brushSize, brushColor, brushColorAlt, saveCanvas} = this.props;
		return (
			<div className="toolbox applightbg flex flex-column items-center black">
				<button className="mv2 black" onClick={saveCanvas}>
					<ion-icon name="ios-save" size="large"/>
				</button>
				<Section label="Size">
					{BRUSH_SIZES.map(size=>{
						return <BrushIcon key={size} size={size} selected={brushSize===size} setBrushSize={this.onBrushSizeButton}/>
					})}
					<input 
						ref="sizeInput" 
						className="w-100 tc" 
						type="number"
						min={MIN_BRUSH_SIZE} 
						max={MAX_BRUSH_SIZE}
						onChange={this.onSizeInputChange}
						onBlur={this.onSizeInputBlur}
					/>
				</Section>
				<Section label="Color 1" nomargin>
					<label className="db w-100 h2" style={{
						backgroundColor: brushColor,
					}}>
						<input 
							ref="color1Input"
							className="dn colorInput w-100"
							type="color" 
							onChange={this.onSetBrushColor(false)}
						/>
					</label>
				</Section>
				<Section label="Color 2" nomargin>
					<label className="db w-100 h2" style={{
						backgroundColor: brushColorAlt,
					}}>
						<input 
							ref="color2Input" 
							className="colorInput dn w-100" 
							type="color" 
							onChange={this.onSetBrushColor(true)}
						/>
					</label>
				</Section>
				<Section label="Palette" nomargin>
					<Palette choosePaletteColor={this.choosePaletteColor}/>
				</Section>
			</div>
		);
	}
}
const Section = ({label, children, nomargin}) => {
	const marginclass = nomargin ? "" : "mb2";
	return <div className={`w-100 ${marginclass}`}>
		{label && <h5 className={`appdarkbg w-100 bt bb b--black white pv1 ma0 ${marginclass}`}>{label}</h5>}
		{children}
	</div>
}
// Brush selection button
const BrushIcon = ({size, selected, setBrushSize}) => {
	const width = `${size}px`, height = width;
	return (
		<div className="h2 w-100 mb1" onClick={()=>setBrushSize(size)}>
			<div className={`brushIcon br2 h-100 flex justify-center items-center mh1 ${selected ? "selected" : ""}`}>
				<div 
					className="br-100 bg-black"
					style={{width,height}}
				/>
			</div>
		</div>
	)
}
export default Toolbox;