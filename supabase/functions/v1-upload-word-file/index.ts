import "jsr:@supabase/functions-js/edge-runtime.d.ts";



Deno.serve(async (req) => {

  const uuid = crypto.randomUUID();
  await Deno.writeFile(`/tmp/${uuid}`, req.body);

});
