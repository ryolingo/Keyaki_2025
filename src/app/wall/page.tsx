"use client";

import { useEffect, useMemo, useState } from "react";
import {
	CommentItem,
	getCommentsFromFirestore,
	subscribeCommentsFromFirestore,
} from "@/lib/firestore";
import { motion } from "framer-motion";

function randomBetween(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

export default function WallPage() {
	const [items, setItems] = useState<CommentItem[]>([]);

	useEffect(() => {
		// リアルタイムでコメントを監視
		const unsubscribe = subscribeCommentsFromFirestore(setItems);
		return () => unsubscribe();
	}, []);

	// 初期ロード（サーバ遷移時の空白防止）
	useEffect(() => {
		const loadInitialComments = async () => {
			try {
				const comments = await getCommentsFromFirestore();
				setItems(comments);
			} catch (error) {
				console.error("コメント取得エラー:", error);
			}
		};
		loadInitialComments();
	}, []);

	// レイアウト用ランダム値をメモ化（ID毎に固定）
	const bubbleLayout = useMemo(() => {
		const map = new Map<
			string,
			{
				left: string;
				top: string;
				width: number; // 文字数に応じて拡大
				height: number; // 文字数に応じて拡大
				delay: number;
				duration: number;
				amplitude: number;
			}
		>();
		for (const item of items) {
			if (!map.has(item.id)) {
				const left = `${Math.floor(randomBetween(5, 85))}%`;
				const top = `${Math.floor(randomBetween(10, 80))}%`;
				// テキスト長に応じてサイズを決定
				const text = item.name ? `${item.name}：${item.comment}` : item.comment;
				const len = Math.max(1, text.length);
				// 横長の楕円を基本に、長いほど大きく（上限あり）
				const width = Math.min(120 + Math.floor(len * 6), 420);
				const height = Math.min(52 + Math.floor(len * 0.9), 140);
				const delay = randomBetween(0, 2); // s
				const duration = randomBetween(4, 9); // s
				const amplitude = randomBetween(16, 48); // 上下の振幅(px)
				map.set(item.id, { left, top, width, height, delay, duration, amplitude });
			}
		}
		return map;
	}, [items]);

	return (
		<div className="min-h-dvh flex flex-col bg-white">
			<header className="p-4">
				<h1 className="text-lg font-bold text-gray-700">みんなの感想</h1>
			</header>
			<main className="relative flex-1 overflow-hidden">
				{/* 背景ロゴ（超薄いウォーターマーク） */}
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<img
						src="/logo.svg"
						alt="logo watermark"
						className="opacity-[0.1] select-none"
						style={{ width: 480, height: 480 }}
					/>
				</div>

				{/* 風船たち */}
				<div className="absolute inset-0">
					{items.length === 0 && (
						<div className="h-full flex items-center justify-center text-gray-500">
							まだコメントがありません。QR から投稿ページを開いて送ってね。
						</div>
					)}

					{items.map((item) => {
						const layout = bubbleLayout.get(item.id)!;
						const display = item.name ? `${item.name}：${item.comment}` : item.comment;
						return (
							<motion.div
								key={item.id}
								className="absolute"
								style={{ left: layout.left, top: layout.top }}
								initial={{ y: 10, opacity: 0 }}
								animate={{ y: [0, -layout.amplitude, 0, layout.amplitude, 0], opacity: 1 }}
								transition={{
									delay: layout.delay,
									// 出現は ease-in、その後 y のループはイージングを変更
									opacity: { duration: 0.6, ease: "easeIn" },
									y: { duration: layout.duration, repeat: Infinity, ease: "easeInOut" },
								}}
							>
								<motion.div
									className="rounded-full bg-pink-300/80 text-white shadow-[0_8px_24px_-12px_rgba(236,72,153,0.35)] backdrop-blur flex items-center justify-center"
									style={{ width: layout.width, height: layout.height, maxWidth: "80vw" }}
									title={display}
									animate={{ scale: [1, 1.04, 0.98, 1] }}
									transition={{ duration: 3.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
								>
									<div className="px-4 text-xs leading-snug break-words text-center font-semibold text-black">
										{display}
									</div>
								</motion.div>
							</motion.div>
						);
					})}
				</div>
			</main>
		</div>
	);
}


