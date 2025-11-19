import { db } from "./firebase";
import {
	collection,
	addDoc,
	getDocs,
	query,
	orderBy,
	limit,
	onSnapshot,
	Timestamp,
	QuerySnapshot,
	DocumentData,
} from "firebase/firestore";
import type { CommentItem } from "./mockStore";

// CommentItem型を再エクスポート（他のファイルでfirestore.tsから直接インポートできるように）
export type { CommentItem };

const COMMENTS_COLLECTION = "comments";

/**
 * Firestoreにコメントを追加
 */
export async function addCommentToFirestore(input: {
	name?: string;
	comment: string;
}): Promise<string> {
	try {
		const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), {
			name: input.name?.trim() || null,
			comment: input.comment.trim(),
			createdAt: Timestamp.now(),
		});
		return docRef.id;
	} catch (error) {
		console.error("Error adding comment to Firestore:", error);
		throw error;
	}
}

/**
 * Firestoreからコメントを取得
 */
export async function getCommentsFromFirestore(
	maxItems: number = 500
): Promise<CommentItem[]> {
	try {
		const q = query(
			collection(db, COMMENTS_COLLECTION),
			orderBy("createdAt", "desc"),
			limit(maxItems)
		);
		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				name: data.name || undefined,
				comment: data.comment,
				createdAt: data.createdAt?.toMillis() || Date.now(),
			} as CommentItem;
		});
	} catch (error) {
		console.error("Error getting comments from Firestore:", error);
		throw error;
	}
}

/**
 * Firestoreのコメント変更をリアルタイムで監視
 * @param callback コメントが更新されたときに呼ばれるコールバック
 * @returns 購読を解除する関数
 */
export function subscribeCommentsFromFirestore(
	callback: (items: CommentItem[]) => void,
	maxItems: number = 500
): () => void {
	const q = query(
		collection(db, COMMENTS_COLLECTION),
		orderBy("createdAt", "desc"),
		limit(maxItems)
	);

	const unsubscribe = onSnapshot(
		q,
		(querySnapshot: QuerySnapshot<DocumentData>) => {
			const items: CommentItem[] = querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					name: data.name || undefined,
					comment: data.comment,
					createdAt: data.createdAt?.toMillis() || Date.now(),
				} as CommentItem;
			});
			callback(items);
		},
		(error) => {
			console.error("Error subscribing to comments:", error);
		}
	);

	return unsubscribe;
}

