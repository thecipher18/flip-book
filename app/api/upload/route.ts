import { withCaller } from "@/lib/apiAuth";
import { findOrCreateAlbum, uploadPhoto } from "@/lib/ownerDrive";

export const POST = withCaller<[]>(
  async (_caller, req) => {
    const form = await req.formData();
    const tag = String(form.get("tag") ?? "").trim();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);

    if (!tag) return Response.json({ error: "Album name required" }, { status: 400 });
    if (!files.length) return Response.json({ error: "No photos" }, { status: 400 });

    const folderId = await findOrCreateAlbum(tag);
    await Promise.all(files.map((file) => uploadPhoto(file, folderId)));
    return Response.json({ folderId });
  },
  { write: true },
);
