import React from "react";
import '../css/Toolbox.css'

const Toolbox = () => {
	return (
		<div className="toolbox applightbg flex flex-column items-center">
            <button className="mv3">Save</button>
			<BrushIcon size="24" selected/>
			<BrushIcon size="16" />
			<BrushIcon size="12" />
			<BrushIcon size="8" />
			<BrushIcon size="4" />
        </div>
	);
}
const BrushIcon = ({size, selected}) => {
	const width = `${size}px`, height = width;
	return (
		<div className="h2 w-100 mb1">
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