import React from 'react';
import '../css/Palette.css';
const colors = [
	"#FFFFFF",
	"#C0C0C0",
	"#606060",
	"#000000",
	"#F8F8E8",
	"#C0C09C",
	"#666640",
	"#191909",
	"#EE4444",
	"#880022",
	"#EECC44",
	"#B55231",
	"#66CC44",
	"#668822",
	"#66CCCC",
	"#226688",
	"#4466CC",
	"#002266",
	"#EE44EE",
	"#A400A4",
];
const Palette = ({choosePaletteColor}) => {
	const onChoosePaletteColor = (color, isAlt) => event => {
		choosePaletteColor(color, isAlt);
		if(isAlt){
			// Prevent context menu
			event.preventDefault();
			return false;
		}
	}
	return <div className="palette flex flex-wrap flex-row-ns flex-column h-100 pointer">
		{colors.map((color, i)=>{
			return <div 
				key={i}
				className="paletteColor" 
				style={{
					background: color,
				}}
				onClick={onChoosePaletteColor(color, false)}
				onContextMenu={onChoosePaletteColor(color, true)}
			>
			</div>
		})}
	</div>
}

export default Palette;