"use client";

import { useEffect, useMemo, useState } from "react";
import {
	CommentItem,
	getCommentsFromFirestore,
	subscribeCommentsFromFirestore,
} from "@/lib/firestore";
import { motion, AnimatePresence } from "framer-motion";

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
	const [newCommentIds, setNewCommentIds] = useState<Set<string>>(new Set());
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const [showNotification, setShowNotification] = useState(false);

	// 初期ロード（一度だけ実行、リロードなし）
	useEffect(() => {
		let isMounted = true;
		
		const loadInitialComments = async () => {
			try {
				const comments = await getCommentsFromFirestore();
				if (isMounted) {
					setItems(comments);
					setIsInitialLoad(false);
				}
			} catch (error) {
				console.error("コメント取得エラー:", error);
				if (isMounted) {
					setIsInitialLoad(false);
				}
			}
		};
		
		loadInitialComments();
		
		return () => {
			isMounted = false;
		};
	}, []);

	// リアルタイムでコメントを監視（初期ロード後）
	useEffect(() => {
		if (isInitialLoad) return;
		
		const unsubscribe = subscribeCommentsFromFirestore((newItems) => {
			setItems((prevItems) => {
				// 新しいコメントを検知
				const prevIds = new Set(prevItems.map(item => item.id));
				const newIds = newItems
					.filter(item => !prevIds.has(item.id))
					.map(item => item.id);
				
				if (newIds.length > 0) {
					// 新しいコメントIDを記録（アニメーション用）
					setNewCommentIds((prev) => {
						const updated = new Set(prev);
						newIds.forEach(id => updated.add(id));
						return updated;
					});
					
					// 画面全体の通知オーバーレイを表示
					setShowNotification(true);
					setTimeout(() => {
						setShowNotification(false);
					}, 2500); // 2.5秒後に非表示
					
					// 3秒後に新しいコメントのフラグを削除
					setTimeout(() => {
						setNewCommentIds((prev) => {
							const updated = new Set(prev);
							newIds.forEach(id => updated.delete(id));
							return updated;
						});
					}, 3000);
				}
				
				return newItems;
			});
		});
		
		return () => unsubscribe();
	}, [isInitialLoad]);

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
			{/* 投稿通知オーバーレイ */}
			<AnimatePresence>
				{showNotification && (
					<motion.div
						className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						{/* ピンクの背景オーバーレイ */}
						<motion.div
							className="absolute inset-0 bg-gradient-to-br from-pink-400/90 via-pink-300/90 to-pink-500/90 backdrop-blur-sm"
							initial={{ opacity: 0 }}
							animate={{ opacity: [0, 1, 1, 0] }}
							exit={{ opacity: 0 }}
							transition={{ duration: 2.5, times: [0, 0.1, 0.9, 1] }}
						/>
						
						{/* メッセージ */}
						<motion.div
							className="relative z-10 text-center"
							initial={{ scale: 0.5, opacity: 0, y: 50 }}
							animate={{ 
								scale: [0.5, 1.2, 1, 1],
								opacity: [0, 1, 1, 0],
								y: [50, -10, 0, -20],
								rotate: [0, 5, -5, 0],
							}}
							exit={{ scale: 0.8, opacity: 0, y: -30 }}
							transition={{ 
								duration: 2.5,
								times: [0, 0.2, 0.5, 1],
								ease: "easeOut"
							}}
						>
							<motion.h2
								className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
								animate={{ 
									textShadow: [
										"0 4px 12px rgba(0,0,0,0.3)",
										"0 8px 24px rgba(236,72,153,0.6), 0 4px 12px rgba(0,0,0,0.3)",
										"0 4px 12px rgba(0,0,0,0.3)",
									]
								}}
								transition={{ duration: 2.5, times: [0, 0.3, 1] }}
							>
								投稿されました！
							</motion.h2>
							
							{/* 装飾的なハートや星 */}
							<div className="absolute inset-0 pointer-events-none">
								{[...Array(6)].map((_, i) => (
									<motion.div
										key={i}
										className="absolute text-4xl"
										style={{
											left: `${20 + i * 15}%`,
											top: `${30 + (i % 2) * 40}%`,
										}}
										initial={{ scale: 0, rotate: 0, opacity: 0 }}
										animate={{ 
											scale: [0, 1.5, 1, 0],
											rotate: [0, 180, 360],
											opacity: [0, 1, 1, 0],
										}}
										transition={{
											duration: 2.5,
											delay: i * 0.1,
											times: [0, 0.2, 0.8, 1],
										}}
									>
										{i % 2 === 0 ? "💕" : "✨"}
									</motion.div>
								))}
							</div>
						</motion.div>
						
						{/* 波のようなアニメーション */}
						<motion.div
							className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-pink-600/30 to-transparent"
							initial={{ y: 100, opacity: 0 }}
							animate={{ 
								y: [100, 0, 0, 100],
								opacity: [0, 0.5, 0.5, 0],
							}}
							exit={{ y: 100, opacity: 0 }}
							transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1] }}
						/>
					</motion.div>
				)}
			</AnimatePresence>
			
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

					<AnimatePresence mode="popLayout">
						{items.map((item, index) => {
							const layout = bubbleLayout.get(item.id);
							if (!layout) return null;
							
							const display = item.name ? `${item.name}：${item.comment}` : item.comment;
							const isNewComment = newCommentIds.has(item.id);
							
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
									exit={{ opacity: 0, scale: 0.8 }}
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
									style={{ 
										width: layout.width, 
										height: layout.height, 
										maxWidth: "80vw",
									}}
									title={display}
									animate={{ scale: [1, 1.05, 1] }}
									transition={{ 
										duration: 2, 
										repeat: Infinity, 
										repeatType: "reverse", 
										ease: "easeInOut" 
									}}
									>
										<div className="px-4 text-xs leading-snug break-words text-center font-semibold text-black">
											{display}
										</div>
									</motion.div>
								</motion.div>
							);
						})}
					</AnimatePresence>
				</div>
			</main>
		</div>
	);
}


