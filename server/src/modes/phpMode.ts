import {
  LanguageMode,
  Position,
  CompletionList,
  CompletionItemKind,
} from "../languageModes";
import { TextDocument } from "vscode-languageserver-textdocument";

export function getPHPMode(): LanguageMode {
  return {
    getId() {
      return "php";
    },
    doComplete(_document: TextDocument, _position: Position) {
      // Basic completion for 'echo'
      return CompletionList.create([
        {
          label: "echo",
          kind: CompletionItemKind.Keyword,
          detail: "Output one or more strings",
          documentation: "Outputs one or more strings in PHP",
        },
      ]);
    },
    onDocumentRemoved(_document: TextDocument) {
      /* nothing to do */
    },
    dispose() {
      /* nothing to do */
    },
  };
}
