/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  TextDocument,
  Position,
  LanguageService,
  TokenType,
  Range,
} from "vscode-html-languageservice";
import { TextDocument as LSPTextDocument } from "vscode-languageserver-textdocument";

export interface LanguageRange {
  start: Position;
  end: Position;
  languageId: string | undefined;
}

export interface HTMLDocumentRegions {
  getEmbeddedDocument(languageId: string): LSPTextDocument;
  getLanguageRanges(range: Range): LanguageRange[];
  getLanguageAtPosition(position: Position): string | undefined;
  getLanguagesInDocument(): string[];
}

interface EmbeddedRegion {
  languageId: string | undefined;
  start: number;
  end: number;
}

export function getDocumentRegions(
  languageService: LanguageService,
  document: TextDocument
): HTMLDocumentRegions {
  const regions: EmbeddedRegion[] = [];
  const scanner = languageService.createScanner(document.getText());
  let lastTagName = "";

  let token = scanner.scan();
  while (token !== TokenType.EOS) {
    switch (token) {
      case TokenType.StartTag:
        lastTagName = scanner.getTokenText();
        if (lastTagName === "php") {
          regions.push({
            languageId: "php",
            start: scanner.getTokenOffset(),
            end: scanner.getTokenEnd(),
          });
        }
        break;
    }
    token = scanner.scan();
  }

  return {
    getLanguageRanges: (range: Range) =>
      getLanguageRanges(document, regions, range),
    getEmbeddedDocument: (languageId: string) =>
      getEmbeddedDocument(document, regions, languageId),
    getLanguageAtPosition: (position: Position) =>
      getLanguageAtPosition(document, regions, position),
    getLanguagesInDocument: () => getLanguagesInDocument(document, regions),
  };
}

function getLanguageRanges(
  document: TextDocument,
  regions: EmbeddedRegion[],
  range: Range
): LanguageRange[] {
  const result: LanguageRange[] = [];
  let currentPos = range ? range.start : Position.create(0, 0);
  let currentOffset = range ? document.offsetAt(range.start) : 0;
  const endOffset = range
    ? document.offsetAt(range.end)
    : document.getText().length;

  for (const region of regions) {
    if (region.end > currentOffset && region.start < endOffset) {
      if (currentOffset < region.start) {
        result.push({
          start: currentPos,
          end: document.positionAt(region.start),
          languageId: "html",
        });
      }
      result.push({
        start: document.positionAt(region.start),
        end: document.positionAt(region.end),
        languageId: region.languageId,
      });
      currentOffset = region.end;
      currentPos = document.positionAt(region.end);
    }
  }

  if (currentOffset < endOffset) {
    result.push({
      start: currentPos,
      end: range ? range.end : document.positionAt(endOffset),
      languageId: "html",
    });
  }

  return result;
}

function getLanguagesInDocument(
  _document: TextDocument,
  regions: EmbeddedRegion[]
): string[] {
  const result = new Set<string>();
  regions.forEach((region) => {
    if (region.languageId) {
      result.add(region.languageId);
    }
  });
  result.add("html");
  return Array.from(result);
}

function getLanguageAtPosition(
  document: LSPTextDocument,
  regions: EmbeddedRegion[],
  position: Position
): string {
  const offset = document.offsetAt(position);
  for (const region of regions) {
    if (region.start <= offset && offset <= region.end) {
      return region.languageId || "html";
    }
  }
  return "html";
}

function getEmbeddedDocument(
  document: TextDocument,
  regions: EmbeddedRegion[],
  languageId: string
): TextDocument {
  const content = document.getText();
  let result = "";
  let currentPos = 0;

  for (const region of regions) {
    if (region.languageId === languageId) {
      result += content.substring(currentPos, region.start);
      result += content.substring(region.start, region.end);
      currentPos = region.end;
    }
  }
  result += content.substring(currentPos);

  return LSPTextDocument.create(
    document.uri,
    languageId,
    document.version,
    result
  );
}
