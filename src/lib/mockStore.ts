export type CommentItem = {
	name?: string;
	comment: string;
	createdAt: number;
	id: string;
};

const STORAGE_KEY = "comments";

function readFromStorage(): CommentItem[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as CommentItem[]) : [];
	} catch {
		return [];
	}
}

function writeToStorage(items: CommentItem[]) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

let subscribers: Array<(items: CommentItem[]) => void> = [];
let bc: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
	bc = new BroadcastChannel("comments_channel");
	bc.onmessage = (event) => {
		if (event?.data?.type === "comments_updated") {
			const items = readFromStorage();
			subscribers.forEach((cb) => cb(items));
		}
	};
}

export function getComments(): CommentItem[] {
	return readFromStorage();
}

export function addComment(input: { name?: string; comment: string }) {
	const now = Date.now();
	const newItem: CommentItem = {
		id: `${now}-${Math.random().toString(36).slice(2)}`,
		createdAt: now,
		name: input.name?.trim() || undefined,
		comment: input.comment.trim(),
	};
	const items = [newItem, ...readFromStorage()].slice(0, 500);
	writeToStorage(items);
	if (bc) {
		bc.postMessage({ type: "comments_updated" });
	}
	subscribers.forEach((cb) => cb(items));
}

export function subscribeComments(cb: (items: CommentItem[]) => void) {
	subscribers.push(cb);
	cb(readFromStorage());
	return () => {
		subscribers = subscribers.filter((s) => s !== cb);
	};
}


