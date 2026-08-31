import { withCaller } from "@/lib/apiAuth";
import { getPhotoResponse } from "@/lib/ownerDrive";

type Ctx = { params: Promise<{ fileId: string }> };

// The owner's token carries the `drive.file` scope, so the worst a crafted
// fileId can reach is another file this app itself created — i.e. the library.
export const GET = withCaller<[Ctx]>(async (_caller, _req, ctx) => {
  const { fileId } = await ctx.params;
  const res = await getPhotoResponse(fileId);
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
      // Photos are immutable once uploaded, but they are private: private
      // means browser-only caching, never a shared/CDN cache.
      "Cache-Control": "private, max-age=3600",
    },
  });
});
