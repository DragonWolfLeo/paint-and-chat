class Node {
	constructor(value, next = null, previous = null){
		this.value = value;
		this.next = next;
		this.previous = previous;
	}
}
class LinkedList {
	constructor(){
		this.head = null;
		this.tail = null;
		this.length = 0;
	}
	append(value){
		const node = new Node(value, null, this.tail);
		if(!this.length){
			this.head = node;
		} else {
			this.tail.next = node;
		}
		this.tail = node;
		this.length++;
		return node;
	}
	prepend(value){
		const node = new Node(value, this.head);
		if(!this.length){
			this.tail = node;
		} else {
			this.head.previous = node;
		}
		this.head = node;
		this.length++;
		return node;
	}
	detach(node){
		if(!node){ return }
		const {next, previous} = node;
		if(this.head === node) this.head = next;
		if(this.tail === node) this.tail = previous;
		node.next = null;
		node.previous = null;
		if(previous) previous.next = next;
		if(next) next.previous = previous;
		return node;
	}
	toArray(){
		const arr = [];
		let next = this.head;
		while(next){
			arr.push(next.value);
			next = next.next;
		}
		return arr;
	}
}

export default LinkedList;