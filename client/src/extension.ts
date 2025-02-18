import * as path from "path";
import {
  workspace,
  ExtensionContext,
  Uri,
  commands,
  CompletionList,
} from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(
    path.join("server", "out", "server.js")
  );

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc },
  };

  // Track virtual documents for PHP content
  const virtualDocumentContents = new Map<string, string>();

  // Register virtual document provider
  workspace.registerTextDocumentContentProvider("embedded-content", {
    provideTextDocumentContent: (uri) => {
      const originalUri = uri.path.slice(1).slice(0, -4);
      const decodedUri = decodeURIComponent(originalUri);
      return virtualDocumentContents.get(decodedUri);
    },
  });

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "vue" }],
    middleware: {
      provideCompletionItem: async (
        document,
        position,
        context,
        token,
        next
      ) => {
        // If the server returns null, it means we're in a PHP region
        const result = await next(document, position, context, token);
        if (result) {
          return result;
        }

        // Handle PHP completion through request forwarding
        const originalUri = document.uri.toString(true);

        // Get the PHP content and create virtual document
        const content = document.getText();
        const phpContent = content.split("<php>")[1].split("</php>")[0]; // Retrieve the PHP content

        virtualDocumentContents.set(originalUri, phpContent);

        const vdocUriString = `embedded-content://php/${encodeURIComponent(
          originalUri
        )}.php`;
        const vdocUri = Uri.parse(vdocUriString);

        return await commands.executeCommand<CompletionList>(
          "vscode.executeCompletionItemProvider",
          vdocUri,
          position,
          context.triggerCharacter
        );
      },
    },
  };

  client = new LanguageClient(
    "vuePhpLanguageServer",
    "Vue PHP Language Server",
    serverOptions,
    clientOptions
  );

  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
