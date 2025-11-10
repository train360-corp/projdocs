import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {CONSTANTS} from "../src/lib/consts.ts";

/**
 * @type {(env: "dev" | "prod") => Promise<void>}
 */
const main = async (env) => {

  const manifestTemplatePath = path.resolve(__dirname, "manifest.template.xml");
  const manifestOutPath = env === "dev"
    ? path.resolve(__dirname, "manifest-local.xml")
    : path.resolve(__dirname, "manifest.xml");


  let xml = fs.readFileSync(manifestTemplatePath, "utf8");

  for (const replacement of replacements) {
    const val = replacement.replace;
    xml = xml.replace(replacement.find, typeof val === "string" ? val : val[env]);
  }


  fs.writeFileSync(manifestOutPath, xml, "utf8");
  console.log(`✅ Generated manifest for ${env}: ${manifestOutPath}`);
}

/**
 * @type {readonly {
 *   "find": RegExp,
 *   "replace": string | {
 *     "dev": string,
 *     "prod": string
 *   }
 * }[]}
 */
const replacements = [
  {
    find: /__GUID__/g,
    replace: CONSTANTS.META.GUID,
  },
  {
    find: /__DOMAIN__/g,
    replace: {
      dev: "https://localhost:8000",
      prod: "https://projdocs.com",
    }
  },
  {
    find: /__TAB_ID__/g,
    replace: CONSTANTS.WORD.TAB.ID
  },
  // GROUP A
  {
    find: /__GROUP_A_ID__/g,
    replace: CONSTANTS.WORD.TAB.GROUPS.A.ID,
  },
  {
    find: /__RETURN_DOC_BTN_ID__/g,
    replace: CONSTANTS.BUTTONS.CHECK_IN.ID
  },
  {
    find: /__RETURN_DOC_FUNC_ID__/g,
    replace: CONSTANTS.BUTTONS.CHECK_IN.FUNC_ID
  },
  // GROUP B
  {
    find: /__GROUP_B_ID__/g,
    replace: CONSTANTS.WORD.TAB.GROUPS.B.ID,
  },
  {
    find: /__SAVE_BUTTON_ID__/g,
    replace: CONSTANTS.BUTTONS.SAVE.ID
  },
  {
    find: /__SAVE_FUNC_ID__/g,
    replace: CONSTANTS.BUTTONS.SAVE.FUNC_ID
  },
  {
    find: /__SAVE_NEW_VERSION_BUTTON_ID__/g,
    replace: CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.ID
  },
  {
    find: /__SAVE_NEW_VERSION_FUNC_ID__/g,
    replace: CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.FUNC_ID
  },
  {
    find: /__SAVE_NEW_DOC_BUTTON_ID__/g,
    replace: CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.ID
  },
  {
    find: /__SAVE_NEW_DOC_FUNC_ID__/g,
    replace: CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.FUNC_ID
  },
  // Tab C
  {
    find: /__GROUP_C_ID__/g,
    replace: CONSTANTS.WORD.TAB.GROUPS.C.ID
  },
  {
    find: /__INSERT_DOC_ID_BUTTON_ID__/g,
    replace: CONSTANTS.BUTTONS.INSERT.ID
  },
  {
    find: /__INSERT_DOC_ID_FUNC__/g,
    replace: CONSTANTS.BUTTONS.INSERT.FUNC_ID
  }
];

// Determine this script's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.argv[2] || "dev"; // e.g. "dev" or "prod"

switch (env) {
  case "dev":
    break;
  case "prod":
    break;
  default:
    throw new Error(`Unknown env: ${env}`);
}

await main(env);