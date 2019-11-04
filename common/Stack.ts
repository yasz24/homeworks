/**
 * This class implements a simple general-purpose stack using lists.
 */

export class Stack<T> {
    private list: T[];

    constructor() {
        this.list = [];
    }

    public push(obj: T): void {
        this.list.push(obj);
    }

    public pop(): T {
        if (this.list.length == 0) {
            throw new Error("Stack is empty: nothing to pop");
        }
        return this.list.pop();
    }

    public peek(): T {
        if (this.list.length == 0) {
            throw new Error("Stack is empty: nothing to peek");
        }
        return this.list[this.list.length - 1];
    }

    public isEmpty(): boolean {
        return this.list.length == 0;
    }
}