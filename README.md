```
bun install
bun run --cwd api dev
```

デプロイ(どっちもdeployするときはapiの方から順番に)

```
bun run --cwd api deploy
bun run --cwd bot deploy
```

Drizzleスキーマに基づいてマイグレーションを生成する

```
bun drizzle-kit generate
```

ローカルのデータベースを更新

```
bun wrangler d1 migrations apply vote --local
```

本番環境のデータベースを更新

```
wrangler d1 migrations apply vote --remote
```
