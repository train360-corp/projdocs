export const CONSTANTS = {
  VALIDATORS: {
    FILENAME: /^(?!\.)(?!.*[\\/])(?!.*\.\.)[A-Za-z0-9._ -]+$/
  } satisfies {
    [id: string]: RegExp
  },
  META: {
    GUID: "02BAD963-836A-4517-9CF2-300D4A81FF5C"
  },
  CONTENT_CONTROLS: {
    FILE_ID: {
      TAG: "projdocs_file_ref"
    }
  } satisfies {
    [id: string]: {
      TAG: string;
    }
  },
  SETTINGS: {
    FILE_REF: "ProjDocsFileRef",
    VERSION_REF: "ProjDocsVersionRef",
    AUTOLOAD: "ProjDocsAutoLoad",
    LAST_SAVE_HASH: "ProjDocsLastSaveHash"
  },
  WORD: {
    TAB: {
      ID: "PD.CT",
      GROUPS: {
        A: {
          ID: "PD.CT.GA"
        },
        B: {
          ID: "PD.CT.GB"
        },
        C: {
          ID: "PD.CT.GC"
        },
      } satisfies {
        [key: string]: {
          ID: `PD.CT.G${string}`,
        }
      },
    }
  },
  BUTTONS: {
    CHECK_IN: { ID: "CheckIn", FUNC_ID: "checkIn" },
    SAVE: { ID: "SaveButton", FUNC_ID: "save" },
    SAVE_AS_NEW_VERSION: { ID: "SaveAsNewVersionButton", FUNC_ID: "saveAsNewVersion" },
    SAVE_AS_NEW_DOCUMENT: { ID: "SaveAsNewDocumentButton", FUNC_ID: "saveAsNewDoc" },
    INSERT: { ID: "InsertDocID", FUNC_ID: "insertDocID" },
  } satisfies { [id: string]: { ID: string, FUNC_ID: string } },
  DESKTOP: {
    HTTP_SERVER: {
      ORIGIN: "https://localhost:9305"
    }
  }
};