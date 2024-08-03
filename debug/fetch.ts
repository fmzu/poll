import { unstable_dev } from "wrangler"

/**
 * ENOENT: Failed to connect
 */
const worker = await unstable_dev("src/index.ts", {})

// const proxy = await getPlatformProxy()

// console.log(proxy.env.DB)

await worker.stop()
