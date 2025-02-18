# Fusion PHP Vue Extension

![Fusion PHP](https://raw.githubusercontent.com/fusion-php/fusion/refs/heads/main/art/logo-dark.png)

![fusion-php-vscode](https://github.com/user-attachments/assets/04441fce-0251-4a3b-8c56-66eacf7bb79e)


A Visual Studio Code extension that provides syntax highlighting for PHP code within Vue files using custom `<php>` tags.

See [Fusion PHP](https://github.com/braedencrankd/fusion-php) repository for more information.

_Please note that this is a work in progress and is not yet ready for production use._

## Features

- Syntax highlighting for PHP code enclosed in `<php>` tags within Vue files
- Preserves standard Vue template syntax highlighting

## Installation

### From Marketplace

Go to the Extensions view in VS Code:

1. Go to the Extensions view.
2. Search for "Fusion PHP"
3. Click Install

### From Source

From the Extensions view in VS Code:

1. Go to the Extensions view.
2. Select Views and More Actions...
3. Select Install from VSIX...
4. Select the `extension.vsix` file in the root of this repository

## Usage

The extension automatically activates for files with the `.vue` extension. PHP code should be wrapped in `<php>` tags:
