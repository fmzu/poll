```
npm install
npm run dev
```

```
npm run deploy
```

```
bun drizzle-kit generate
```

ローカルのデータベースを更新
```
wrangler d1 migrations apply vote --local
```

本番環境のデータベースを更新
```
wrangler d1 migrations apply vote --remote
```