import server from "../dist/server/server.js";

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host  = req.headers["x-forwarded-host"] || req.headers.host;
  const url   = `${proto}://${host}${req.url}`;

  // Convert Node.js req → Web Request
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

  const webRequest = new Request(url, {
    method: req.method,
    headers: Object.fromEntries(
      Object.entries(req.headers).filter(([, v]) => v !== undefined)
    ),
    body: body && body.length > 0 ? body : undefined,
  });

  // Call TanStack Start server
  const webResponse = await server.fetch(webRequest, {}, {});

  res.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => res.setHeader(key, value));
  const responseBody = await webResponse.arrayBuffer();
  res.end(Buffer.from(responseBody));
}
