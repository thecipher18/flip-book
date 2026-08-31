import { withCaller } from "@/lib/apiAuth";
import { getAlbumName, listPhotos } from "@/lib/ownerDrive";

type Ctx = { params: Promise<{ folderId: string }> };

export const GET = withCaller<[Ctx]>(async (_caller, _req, ctx) => {
  const { folderId } = await ctx.params;
  const [name, photos] = await Promise.all([
    getAlbumName(folderId),
    listPhotos(folderId),
  ]);
  return Response.json({ name, photos });
});
