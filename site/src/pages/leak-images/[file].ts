import type { APIRoute, GetStaticPaths } from 'astro';
import { getAllLeaks, getLeakImageFiles } from '../../lib/leaks';

export const getStaticPaths: GetStaticPaths = async () => {
  // getAllLeaks() populates the image map as a side effect (memoized, one
  // Mongo query per build), so it must resolve before reading it.
  await getAllLeaks();
  return [...getLeakImageFiles().keys()].map((file) => ({ params: { file } }));
};

export const GET: APIRoute = async ({ params }) => {
  await getAllLeaks();
  const image = getLeakImageFiles().get(params.file as string);
  if (!image) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: { 'Content-Type': image.mime },
  });
};
