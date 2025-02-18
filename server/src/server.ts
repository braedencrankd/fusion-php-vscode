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
  RequestType,
  Position,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getDocumentRegions } from "./embeddedSupport";
import { getLanguageService } from "vscode-html-languageservice";

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents = new TextDocuments(TextDocument);

const htmlLanguageService = getLanguageService();

// Add this type for PHP language server capabilities
interface PHPLanguageServer {
  capabilities: {
    completionProvider?: boolean;
    // Add other capabilities as needed
  };
}

let phpLanguageServer: PHPLanguageServer | undefined;

connection.onInitialize((params: InitializeParams) => {
  // Check if PHP language server is available in the client capabilities
  const phpServer = params.initializationOptions?.phpLanguageServer;
  if (phpServer) {
    phpLanguageServer = phpServer;
  }

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      // Tell the client that the server supports code completion
      completionProvider: {
        resolveProvider: false,
      },
    },
  };
});

connection.onDidChangeConfiguration((_change) => {
  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument) {
  try {
    console.log("validateTextDocument", textDocument);
  } catch (e) {
    connection.console.error(`Error while validating ${textDocument.uri}`);
    connection.console.error(String(e));
  }
}

// Helper function to check if position is in PHP region
function isInPHPRegion(document: TextDocument, position: Position): boolean {
  const regions = getDocumentRegions(htmlLanguageService, document);
  const languageId = regions.getLanguageAtPosition(position);
  console.log("languageId", languageId);
  return languageId === "php";
}

// Modify the completion handler to forward PHP requests
connection.onCompletion(async (textDocumentPosition, token) => {
  const document = documents.get(textDocumentPosition.textDocument.uri);
  if (!document) {
    return null;
  }

  if (isInPHPRegion(document, textDocumentPosition.position)) {
    if (phpLanguageServer?.capabilities.completionProvider) {
      // Forward the request to PHP language server
      return await connection.sendRequest(
        new RequestType("textDocument/completion"),
        textDocumentPosition,
        token
      );
    }
  }

  // Handle non-PHP completions here
  return null;
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
