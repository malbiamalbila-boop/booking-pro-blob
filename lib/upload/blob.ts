import { createClient } from "@vercel/blob";

const client = createClient({ token: process.env.BLOB_READ_WRITE_TOKEN ?? "" });

export async function createSignedUploadUrl(opts: { contentType: string; prefix?: string }) {
  const pathname = `${opts.prefix ?? "uploads"}/${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return client.generateUploadUrl({
    pathname,
    access: "private",
    contentType: opts.contentType,
    cacheControlMaxAge: 0,
  });
}

export async function getBlobUrl(key: string) {
  const { url } = await client.getBlob(key);
  return url;
}
