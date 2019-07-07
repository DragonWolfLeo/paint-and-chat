// Creates an object containing funnctions to add and remove event listeners from an array of args
function eventListenerSetup(target, ...argsArray){
	return ["add", "remove"].reduce((acc, action)=>{
		acc[action] = () => argsArray.forEach(args=>{
			target[action+"EventListener"](...args);
		});
		return acc;
	}, {});
}

// Returns true if screen size is desktop mode
const isDesktopMode = () => window.matchMedia("only screen and (min-width: 30em)").matches;

export {
	eventListenerSetup,
	isDesktopMode,
};