import { asConst, FromSchema } from "json-schema-to-ts";
import { handle, withAuth } from "@workspace/web/lib/api";
import * as unzipper from "unzipper";
import { CentralDirectory } from "unzipper";
import { createClient } from "@workspace/web/lib/supabase/server";
import { json2xml, xml2json } from "xml-js";
import * as process from "node:process";
import { CONSTANTS } from "@workspace/word/src/lib/consts";
import JSZip from "jszip";
import { uploadFile } from "@workspace/web/lib/supabase/upload-file";
import { v4 } from "uuid";



const schema = asConst({
  type: "object",
  required: [ "file", "project", "directory" ],
  properties: {
    file: {
      type: "string"
    },
    directory: {
      type: "object",
      required: [ "id" ],
      properties: {
        id: {
          type: "string"
        }
      }
    },
    project: {
      type: "object",
      required: [ "id" ],
      properties: {
        id: {
          type: "string"
        }
      }
    }
  },
});


export const POST: RouteHandler = withAuth(handle<FromSchema<typeof schema>>(schema, async (data) => {

  // validate the file
  const { ok, reason } = await validateWordBase64(data.file);
  if (!ok) return Response.json({
    error: `invalid file: ${reason}`,
  }, { status: 400 });

  const supabase = await createClient();


  const buf = Buffer.from(data.file, "base64");
  const docx = await unzipper.Open.buffer(buf);
  const jszip = await JSZip.loadAsync(buf);

  // load the file
  let docID: string | null = null;
  let verID: string | null = null;
  const settings = await getWebExtensionFiles(docx);
  for (const f of settings) {
    const contents = JSON.parse(xml2json(f.xml));
    if (
      contents.elements.length === 1 &&
      contents.elements[0].name === "we:webextension" &&
      undefined !== contents.elements[0].elements.find((e: any) => e.name === "we:reference" && e.attributes.id.toLowerCase() === CONSTANTS.META.GUID.toLowerCase())
    ) {

      const iProps: number = contents.elements[0].elements.findIndex((e: any) => e.name === "we:properties");


      // create doc
      docID = contents.elements[0].elements[iProps].elements.find((e: any) => e.name === "we:property" && e.attributes.name === CONSTANTS.SETTINGS.FILE_REF)?.attributes?.value;
      if (docID !== null && docID !== undefined) return Response.json({
        error: `document already exists: ${docID}`,
        hint: "use PUT to create a new version"
      }, { status: 400 });
      const doc = await supabase.from("files").insert({}).select().single();
      if (doc.error) return Response.json({
        error: "unable to create file object-row",
        detail: doc.error
      }, { status: 500 });
      docID = `${doc.data.number}`;
      contents.elements[0].elements[iProps].elements.push({
        type: "element",
        name: "we:property",
        attributes: { name: CONSTANTS.SETTINGS.FILE_REF, value: docID }
      });

      // create version
      verID = contents.elements[0].elements[iProps].elements.find((e: any) => e.name === "we:property" && e.attributes.name === CONSTANTS.SETTINGS.VERSION_REF)?.attributes?.value;
      if (verID !== null) return Response.json({
        error: `document does not exist, but has a version ID: ${verID}`,
      }, { status: 400 });
      contents.elements[0].elements[iProps].elements.push({
        type: "element",
        name: "we:property",
        attributes: { name: CONSTANTS.SETTINGS.VERSION_REF, value: "1" } // will be the first version
      });

      // upload file
      jszip.file(f.path, json2xml(JSON.stringify(contents)));
      const newFile = await jszip.generateAsync({
        type: "blob"
      });

      await uploadFile(supabase, {
        directory: data.directory,
        bucket: data.project.id,
        file: {
          object: { id: docID }, // new file
          data: newFile
        },
      });

      return Response.json({
        file: newFile,
      });


    }
  }


  return Response.json({}, { status: 201 });

}));


/**
 * Safely validates whether a Base64 string represents a Word (.docx) file.
 * - Protects against ZIP bombs (limits entry count, size, and paths)
 * - Detects required DOCX internal structure
 * - Never fully extracts files to memory
 */
async function validateWordBase64(base64: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  try {
    // ---- Step 1: Base64 sanity ----
    if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
      return { ok: false, reason: "Invalid Base64 characters" };
    }

    const buf = Buffer.from(base64, "base64");
    if (buf.length > 25 * 1024 * 1024) {
      return { ok: false, reason: "Encoded file too large (>25MB)" };
    }

    // ---- Step 2: ZIP signature check ----
    if (buf.readUInt32LE(0) !== 0x04034b50) {
      return { ok: false, reason: "Missing ZIP header (not PK\\x03\\x04)" };
    }

    // ---- Step 3: Stream parse entries ----
    const directory = await unzipper.Open.buffer(buf);
    const required = new Set([
      "[Content_Types].xml",
      "_rels/.rels",
      "word/document.xml",
    ]);

    let totalUncompressed = 0;
    const MAX_ENTRIES = 2000;
    const MAX_UNCOMPRESSED = 100 * 1024 * 1024; // 100MB cap

    for (const entry of directory.files) {
      // ZIP-bomb defenses
      if (entry.path.includes("..") || entry.path.startsWith("/")) {
        return { ok: false, reason: "Path traversal attempt detected" };
      }

      if (directory.files.length > MAX_ENTRIES) {
        return { ok: false, reason: "Too many entries (potential ZIP bomb)" };
      }

      totalUncompressed += entry.uncompressedSize ?? 0;
      if (totalUncompressed > MAX_UNCOMPRESSED) {
        return { ok: false, reason: "Uncompressed size too large (ZIP bomb risk)" };
      }

      if (required.has(entry.path)) {
        required.delete(entry.path);
      }
    }

    if (required.size > 0) {
      return { ok: false, reason: "Missing required DOCX internal files" };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err.message || "Invalid ZIP structure" };
  }
}

async function getWebExtensionFiles(directory: CentralDirectory) {
  const webExtensions: { path: string; xml: string }[] = [];
  for (const entry of directory.files) {
    if ((/^word\/webextensions\/webextension\d+\.xml$/).test(entry.path)) {
      const xml = await entry.buffer().then((b) => b.toString("utf8"));
      webExtensions.push({ path: entry.path, xml });
    }
  }

  return webExtensions;
}