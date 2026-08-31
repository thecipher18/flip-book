import { withCaller } from "@/lib/apiAuth";
import { listAlbums } from "@/lib/ownerDrive";

export const GET = withCaller(async () => Response.json(await listAlbums()));
