"use client";

import { useEffect, useMemo, useState } from "react";
import {
	CommentItem,
	getCommentsFromFirestore,
	subscribeCommentsFromFirestore,
} from "@/lib/firestore";
import { motion } from "framer-motion";

// コメントの幅を考慮して、重ならないX位置を計算
function calculateNonOverlappingPositions(
	items: CommentItem[]
): Map<string, { left: number; width: number; height: number }> {
	const map = new Map<string, { left: number; width: number; height: number }>();
	const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1920; // デフォルト1920px
	const minMargin = 20; // 最小マージン（px）
	const minLeft = 40; // 左端の最小マージン（px）
	const maxRight = screenWidth - 40; // 右端の最大マージン（px）
	
	// 各コメントの幅を計算
	const itemsWithWidth = items.map((item) => {
		const text = item.name ? `${item.name}：${item.comment}` : item.comment;
		const len = Math.max(1, text.length);
		const width = Math.min(120 + Math.floor(len * 6), 420);
		const height = Math.min(52 + Math.floor(len * 0.9), 140);
		return { item, width, height };
	});
	
	// 左から右に順番に配置（重ならないように）
	let currentX = minLeft;
	
	itemsWithWidth.forEach(({ item, width, height }) => {
		// 画面幅を超える場合は、左端に戻す
		if (currentX + width + minMargin > maxRight) {
			currentX = minLeft;
		}
		
		// 中央揃えのため、leftは中心位置を指定
		const left = (currentX + width / 2) / screenWidth * 100; // %に変換
		
		map.set(item.id, { left, width, height });
		
		// 次のコメントの位置を更新（現在のコメントの右端 + マージン）
		currentX += width + minMargin;
	});
	
	return map;
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

	// レイアウト用の値をメモ化（重ならないように配置）
	const bubbleLayout = useMemo(() => {
		const positionMap = calculateNonOverlappingPositions(items);
		const map = new Map<
			string,
			{
				left: number; // X位置（%）
				width: number; // 文字数に応じて拡大
				height: number; // 文字数に応じて拡大
				duration: number; // 上昇速度（秒）
				delay: number; // 開始遅延（秒）
			}
		>();
		
		// 各コメントに順番を割り当て（インデックス）
		items.forEach((item, index) => {
			const position = positionMap.get(item.id);
			if (!position) return;
			
			// 上昇速度は一定（炭酸のように）
			const duration = 15 + (index % 5) * 2; // 15-23秒の間で変化
			
			// 開始遅延は順番に（下から上に順番に出現）
			const delay = index * 0.5; // 0.5秒ずつずらす
			
			map.set(item.id, {
				left: position.left,
				width: position.width,
				height: position.height,
				duration,
				delay,
			});
		});
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

					{items.map((item, index) => {
						const layout = bubbleLayout.get(item.id);
						if (!layout) return null;
						
						const display = item.name ? `${item.name}：${item.comment}` : item.comment;
						
						// 下から上に移動（100vh + 自身の高さ分下から開始 → -100px上まで）
						// 画面の高さを100vhとして計算
						const startY = 100; // 画面下から100vh分下（%）
						const endY = -10; // 画面上から10vh分上（%）
						
						return (
							<motion.div
								key={item.id}
								className="absolute"
								style={{ 
									left: `${layout.left}%`,
									// X位置の調整（幅を考慮して中央揃え）
									transform: "translateX(-50%)",
								}}
								initial={{ y: `${startY}vh`, opacity: 0 }}
								animate={{ 
									y: [`${startY}vh`, `${endY}vh`],
									opacity: [0, 1, 1, 0],
								}}
								transition={{
									delay: layout.delay,
									duration: layout.duration,
									repeat: Infinity,
									repeatDelay: 0,
									ease: "linear", // 一定速度で上昇（炭酸のように）
									times: [0, 0.05, 0.95, 1], // 最初と最後でフェードイン/アウト
								}}
							>
								<motion.div
									className="rounded-full bg-pink-300/80 text-white shadow-[0_8px_24px_-12px_rgba(236,72,153,0.35)] backdrop-blur flex items-center justify-center"
									style={{ width: layout.width, height: layout.height, maxWidth: "80vw" }}
									title={display}
									animate={{ scale: [1, 1.05, 1] }}
									transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
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


