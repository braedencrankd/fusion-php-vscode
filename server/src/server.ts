/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
  createConnection,
  InitializeParams,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
  CompletionList,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
// import { getDocumentRegions } from "./embeddedSupport";
// import { getLanguageService } from "vscode-html-languageservice";

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents = new TextDocuments(TextDocument);

// const htmlLanguageService = getLanguageService();

connection.onInitialize((_params: InitializeParams) => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      // We'll handle completions through request forwarding
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ["$", ">", ":", "<"],
      },
    },
  };
});

connection.onCompletion(async (textDocumentPosition, _token) => {
  const document = documents.get(textDocumentPosition.textDocument.uri);
  if (!document) {
    return null;
  }

  // Get document regions to determine if we're in a PHP section
  const documentText = document.getText();
  const phpStartMatch = /<php>/gi;
  const phpEndMatch = /<\/php>/gi;

  const phpRanges = [];
  let startMatch;
  let endMatch;

  while ((startMatch = phpStartMatch.exec(documentText)) !== null) {
    endMatch = phpEndMatch.exec(documentText);
    if (endMatch) {
      const startPos = document.positionAt(startMatch.index + 5); // +5 to skip <php>
      const endPos = document.positionAt(endMatch.index);
      phpRanges.push({
        start: startPos,
        end: endPos,
        languageId: "php",
      });
    }
  }

  // Check if the position is within a PHP region
  const position = textDocumentPosition.position;
  const isInPhp = phpRanges.some((range) => {
    return (
      (position.line > range.start.line ||
        (position.line === range.start.line &&
          position.character >= range.start.character)) &&
      (position.line < range.end.line ||
        (position.line === range.end.line &&
          position.character <= range.end.character))
    );
  });

  if (isInPhp) {
    return null;
  }

  // Handle non-PHP completions (Vue template completions, etc)
  return CompletionList.create([]);
});

// Add completion resolve handler
connection.onCompletionResolve((item) => {
  return item;
});

// Listen for document changes
documents.listen(connection);

// Start the server
connection.listen();
