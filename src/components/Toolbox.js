import React from "react";
import '../css/Toolbox.css'
const brushSizes = [24, 16, 12, 8, 4];
const Toolbox = ({brushSize, brushColor, setBrushSize}) => {
	return (
		<div className="toolbox applightbg flex flex-column items-center">
            <button className="mv3 black"><ion-icon name="ios-save" size="large"/></button>
			{brushSizes.map(size=>{
				return <BrushIcon key={size} size={size} selected={brushSize===size} setBrushSize={setBrushSize}/>
			})}
        </div>
	);
}
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