"use client";

import { useCallback, useState } from "react";
import { addCommentToFirestore } from "@/lib/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function SubmitPage() {
	const [name, setName] = useState("");
	const [comment, setComment] = useState("");
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	const onSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setError(null);
			if (!comment.trim()) {
				setError("コメントを入力してください。");
				return;
			}
			try {
				setSending(true);
				// Firestoreにコメントを保存
				await addCommentToFirestore({ name, comment });
				setName("");
				setComment("");
				setDone(true);
				// モーダルを自動でクリア（10秒後）
				setTimeout(() => setDone(false), 10000);
			} catch (error) {
				console.error("コメント送信エラー:", error);
				setError("送信に失敗しました。時間をおいて再度お試しください。");
			} finally {
				setSending(false);
			}
		},
		[name, comment]
	);

	return (
		<div className="min-h-dvh relative flex flex-col items-center justify-center p-6 bg-white overflow-hidden">
			{/* 背景のポップな装飾 */}
			<motion.img
				src="/logo.svg"
				alt="logo watermark"
				className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10"
				style={{ width: 360, height: 360 }}
				initial={{ scale: 0.95, rotate: -8, opacity: 0 }}
				animate={{ scale: [0.95, 1.02, 0.98, 1], rotate: [-8, -6, -8], opacity: 0.08 }}
				transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
			/>
			<motion.div
				className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-pink-200/40"
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: [0.9, 1, 0.95, 1], opacity: 1, y: [0, -6, 0] }}
				transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
			/>
			<motion.div
				className="pointer-events-none absolute -bottom-12 -right-10 w-56 h-56 rounded-full bg-pink-300/30"
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: [1, 0.96, 1.02, 1], opacity: 1, y: [0, 8, 0] }}
				transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
			/>

			<motion.div
				className="w-full max-w-md rounded-3xl border border-pink-200/70 bg-white/80 backdrop-blur p-6 shadow-[0_15px_40px_-20px_rgba(236,72,153,0.35)]"
				initial={{ y: 12, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.5, ease: "easeIn" }}
			>
				<div className="flex items-center gap-3 mb-2">
					<motion.img
						src="/logo.svg"
						alt="logo"
						className="h-8 w-8"
						initial={{ y: -4, opacity: 0 }}
						animate={{ y: 0, opacity: 1, rotate: [0, -4, 0, 4, 0] }}
						transition={{ duration: 0.6, ease: "easeIn" }}
					/>
					<h1 className="text-2xl font-extrabold text-pink-600">感想を送る</h1>
				</div>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-1">
						<label className="block text-sm text-gray-500">お名前（任意）</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="例: けやき太郎"
							className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300 text-black"
						/>
					</div>
					<div className="space-y-1">
						<label className="block text-sm text-gray-500">コメント</label>
						<textarea
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							placeholder="感想を入力してください"
							rows={4}
							className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300 text-black placeholder:text-gray-400"
						/>
					</div>
					{error && <p className="text-sm text-red-500">{error}</p>}
					<motion.button
						type="submit"
						disabled={sending}
						whileTap={{ scale: 0.98 }}
						whileHover={{ scale: 1.02 }}
						className="w-full rounded-2xl bg-pink-500 text-white py-3 font-semibold hover:bg-pink-600 disabled:opacity-60"
					>
						{sending ? "送信中..." : "送信する"}
					</motion.button>
				</form>
			</motion.div>

{/* 綿菓子のようなモーダル（円形クリップで丸く消える） */}
      <AnimatePresence>
        
				{done && (
					<>
						{/* 背景オーバーレイ */}
						<motion.div
							className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
							onClick={() => setDone(false)}
						/>
						{/* モーダル本体 */}
						<div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl px-6 pointer-events-none">
							<motion.div
								className="rounded-3xl bg-gradient-to-br from-pink-100 via-pink-50 to-white p-8 shadow-[0_20px_60px_-15px_rgba(236,72,153,0.4)] border border-pink-200/50 pointer-events-auto"
								initial={{ 
									clipPath: "circle(0% at 50% 50%)",
									opacity: 0,
									scale: 0.3
								}}
								animate={{
									clipPath: "circle(70% at 50% 50%)",
									opacity: 1,
									scale: 1
								}}
								exit={{
									clipPath: "circle(0% at 50% 50%)",
									opacity: 0,
									scale: 0.8
								}}
								transition={{
									duration: 0.5,
									ease: [0.4, 0, 0.2, 1]
								}}
							>
								<motion.p
									className="text-center text-md font-bold text-pink-700 leading-relaxed"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ delay: 0.2, duration: 0.3 }}
								>
                                   ご来場いただき
                                   <br />
                                   ありがとうございました！
                                   <br />
                                   引き続き、欅祭をお楽しみください🍑
								</motion.p>
							</motion.div>
						</div>
						{/* Xアカウントフォロー促しセクション */}
						<motion.div
							className="fixed left-1/2 top-[calc(50%+220px)] -translate-x-1/2 z-50 w-full max-w-xl px-6 pointer-events-none"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							transition={{ delay: 0.4, duration: 0.4 }}
						>
							<div className="relative flex items-center justify-center gap-2 pointer-events-auto">
								{/* 左矢印（右に動いてカードに向かう） */}
								<motion.div
									className="text-pink-500 text-2xl"
									animate={{ x: [-12, 0, -12] }}
									transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
								>
									←
								</motion.div>
								<a
									href="https://x.com/PeachTech_0927"
									target="_blank"
									rel="noopener noreferrer"
									className="text-center text-sm font-semibold text-pink-600 hover:text-pink-700 underline decoration-pink-300 hover:decoration-pink-400 transition-colors"
								>
									このXアカウントもぜひフォローしてください！
								</a>
								{/* 右矢印（左に動いてカードに向かう） */}
								<motion.div
									className="text-pink-500 text-2xl"
									animate={{ x: [12, 0, 12] }}
									transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
								>
									→
								</motion.div>
							</div>
						</motion.div>
						{/* Instagram フォロー促しセクション */}
						<motion.div
							className="fixed left-1/2 top-[calc(50%+260px)] -translate-x-1/2 z-50 w-full max-w-xl px-6 pointer-events-none"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							transition={{ delay: 0.5, duration: 0.4 }}
						>
							<div className="relative flex items-center justify-center gap-2 pointer-events-auto">
								<motion.div
									className="text-pink-500 text-2xl"
									animate={{ x: [-12, 0, -12] }}
									transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
								>
									←
								</motion.div>
								<a
									href="https://www.instagram.com/peachtech_0927/"
									target="_blank"
									rel="noopener noreferrer"
									className="text-center text-sm font-semibold text-pink-600 hover:text-pink-700 underline decoration-pink-300 hover:decoration-pink-400 transition-colors"
								>
									Instagram もぜひフォローしてください！
								</a>
								<motion.div
									className="text-pink-500 text-2xl"
									animate={{ x: [12, 0, 12] }}
									transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
								>
									→
								</motion.div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}


