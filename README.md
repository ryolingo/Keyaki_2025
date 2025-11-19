This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Firestore セットアップ

このプロジェクトではFirestoreを使用しています。以下の手順で環境を構築してください。

### 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. 「ウェブアプリにFirebaseを追加」をクリック
4. アプリのニックネームを入力して登録

### 2. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

これらの値は、Firebase Consoleの「プロジェクトの設定」→「全般」タブ→「マイアプリ」セクションから取得できます。

### 3. Firestoreデータベースの作成

1. Firebase Consoleで「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. セキュリティルールを設定（開発中はテストモードでも可）
4. **ロケーションを選択**
   - 日本国内での利用推奨: **asia-northeast1（東京）** または **asia-northeast2（大阪）**
   - ⚠️ **重要**: ロケーションは一度設定すると変更できません。慎重に選択してください。

### 3-1. セキュリティルールの設定（重要）

「Missing or insufficient permissions」エラーが出る場合は、セキュリティルールを更新してください：

1. Firebase Console → 「Firestore Database」→ 「ルール」タブ
2. 以下のルールをコピー＆ペーストして「公開」をクリック：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // commentsコレクションへの読み書きを許可（開発用）
    match /comments/{document=**} {
      allow read, write: if true;
    }
  }
}e
```

⚠️ **本番環境では適切なセキュリティルールに変更してください。** 上記のルールは開発・テスト用で、誰でも読み書き可能です。

### 4. 使用方法

Firestoreの機能は `src/lib/firestore.ts` から利用できます：

```typescript
import { addCommentToFirestore, getCommentsFromFirestore, subscribeCommentsFromFirestore } from "@/lib/firestore";

// コメントを追加
await addCommentToFirestore({ name: "ユーザー名", comment: "コメント内容" });

// コメントを取得
const comments = await getCommentsFromFirestore(100);

// リアルタイムでコメントを監視
const unsubscribe = subscribeCommentsFromFirestore((comments) => {
  console.log("コメントが更新されました:", comments);
});
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Vercel環境変数の設定（重要）

VercelにデプロイしたアプリからFirestoreに投稿できるようにするには、Vercelの環境変数を設定する必要があります：

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. プロジェクト「keyaki-2025」を選択
3. 「Settings」→「Environment Variables」をクリック
4. 以下の環境変数を追加（`.env.local`と同じ値）：

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

5. 各環境変数を追加後、「Production」「Preview」「Development」すべてにチェックを入れる
6. 「Save」をクリック
7. **重要**: 環境変数を追加した後、**再デプロイ**が必要です
   - 「Deployments」タブから最新のデプロイを選択
   - 「Redeploy」をクリック

これで本番環境（https://keyaki-2025.vercel.app/）からもFirestoreに投稿できるようになります。

# Keyaki_2025
