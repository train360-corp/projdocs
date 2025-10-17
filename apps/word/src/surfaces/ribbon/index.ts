import { Ribbon } from "@workspace/word/lib/ribbon";



Office.initialize = Ribbon.setup;
Office.onReady(Ribbon.setup).catch((e) => console.error(e));
