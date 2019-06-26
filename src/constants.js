// Chat
const MESSAGE_TYPES = Object.freeze({
	// Global
	USER_MESSAGE: "user_message",
	USER_JOIN: "user_join",
	USER_DISCONNECT: "user_disconnect",
	// Client-only
	NEW_MESSAGE: "new_message",
});

// Tools
const MIN_BRUSH_SIZE = 1;
const MAX_BRUSH_SIZE = 100;

export {
	MESSAGE_TYPES,
	MIN_BRUSH_SIZE,
	MAX_BRUSH_SIZE,
};