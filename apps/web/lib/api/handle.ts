import { JSONSchema } from "json-schema-to-ts";
import Ajv from "ajv";
import { createClient } from "@workspace/web/lib/supabase/server";

export const handle = <T>(schema: JSONSchema, handler: (data: T) => Promise<Response>): RouteHandler => async (request) => {

  let data: T;
  const ajv = new Ajv();
  const validate = ajv.compile(schema);

  // pre-process
  try {
    const body = await request.json();
    if (validate(body)) data = body;
    else return Response.json({
      error: "request-body validation failed",
    }, {
      status: 400,
    });
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.error(e);
    return Response.json({
      error: "unable to read body as json"
    }, {
      status: 400
    });
  }

  // process
  try {
    return await handler(data);
  } catch (e) {
    console.error(e);
    return Response.json({
      error: "an error occurred while processing request"
    }, {
      status: 500
    });
  }
};