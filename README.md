```
bun install
bun run --cwd api dev
```

```
bun run --cwd api deploy
bun run --cwd bot deploy
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