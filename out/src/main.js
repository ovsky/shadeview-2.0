"use strict";
Object.defineProperty(exports, "__esModule", {
    value: !0
}), exports.activate = void 0;

const { renderShader } = require('./ShaderRenderer.js');
const vscode = require("vscode"),
    SLHoverProvider_1 = require("./SLHoverProvider"),
    SLCompletionItemProvider_1 = require("./SLCompletionItemProvider"),
    SLSignatureHelpProvider_1 = require("./SLSignatureHelpProvider"),
    SLDocumentFormatter_1 = require("./SLDocumentFormatter"),
    SLDocumentRangeFormatter_1 = require("./SLDocumentRangeFormatter"),
    SLSymbolProvider_1 = require("./SLSymbolProvider"),
    SLDefinitionProvider_1 = require("./SLDefinitionProvider"),
    SLFoldingRangeProvider_1 = require("./SLFoldingRangeProvider"),
    // ShaderRenderer_1 = require("./ShaderRenderer"),
    requests = require("axios"),
    path = require("path"),
    os = require("os"),
    file = require("fs"),
    open = require("opn"),
    SLDiagnosticProvider_1 = require("./SLDiagnosticProvider"),
    SHADEVIEW_MODE = {
        language: "ShadeView",
        scheme: "file"
    },
    VERSION_URL = "https://www.orlowski.works/shadeview/version/",
    GITHUB_LINK = "https://github.com/ovsky/shadeview-2.0",
    MARKET_LINK = "https://marketplace.visualstudio.com/items?itemName=awwsky.shadeview",
    VERSION = "2.0.25";

const extensionId = "awwsky.shadeview";

function activate(e) {
    e.subscriptions.push(vscode.languages.registerHoverProvider(SHADEVIEW_MODE, new SLHoverProvider_1.default));
    e.subscriptions.push(vscode.languages.registerCompletionItemProvider(SHADEVIEW_MODE, new SLCompletionItemProvider_1.default, ...SLCompletionItemProvider_1.default.triggerCharacters));
    e.subscriptions.push(vscode.languages.registerSignatureHelpProvider(SHADEVIEW_MODE, new SLSignatureHelpProvider_1.default, ...SLSignatureHelpProvider_1.default.triggerChars));
    e.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(SHADEVIEW_MODE, new SLDocumentFormatter_1.default));
    e.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(SHADEVIEW_MODE, new SLDocumentRangeFormatter_1.default));
    e.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(SHADEVIEW_MODE, new SLSymbolProvider_1.default));
    e.subscriptions.push(vscode.languages.registerDefinitionProvider(SHADEVIEW_MODE, new SLDefinitionProvider_1.default));
    e.subscriptions.push(vscode.languages.registerFoldingRangeProvider(SHADEVIEW_MODE, new SLFoldingRangeProvider_1.SLFoldingRangeProvider));

    SLDiagnosticProvider_1.default.register(e);
    vscode.workspace.onDidChangeTextDocument(handleRealtimeCommentInput);
    showUpdateNotifitionIfNeeds();

    const disposable = vscode.commands.registerCommand('shaderPreview.renderShader', () => {
        vscode.window.showInformationMessage('Shader Viewer - Renderer Toggled!');
        renderShader(); // Call the method from renderer.js
    });

    e.subscriptions.push(disposable);
    checkExtensionUpdate();
}

function getInstalledExtensionVersion(extensionId) {
    // Retrieve the extension by its identifier (publisher.extensionName)
    const extension = vscode.extensions.getExtension(extensionId);

    // Check if the extension is installed
    if (extension) {
        // Access the version from the extension's package.json
        const version = extension.packageJSON.version;
        return version;
    } else {
        console.error(`Extension with ID '${extensionId}' is not installed.`);
        return null;
    }
}

function compareExtensionVersions(version1, version2) {
    // Split version strings into arrays of numbers
    const parts1 = version1.split(".").map(Number);
    const parts2 = version2.split(".").map(Number);

    // Determine the longest version array for comparison
    const maxLength = Math.max(parts1.length, parts2.length);

    // Compare each part of the version strings
    for (let i = 0; i < maxLength; i++) {
        // Get the current part, defaulting to 0 if it's not available
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;

        // Compare the current parts
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }

    // Versions are equal
    return 0;
}

function checkExtensionUpdate() {
    const localVersion = getInstalledExtensionVersion(extensionId) ?? `0.0.0`;
    const remoteVersion = vscode.extensions.getExtension("awwsky.shadeview").packageJSON.version ?? `0.0.0`;
    const debug = false;

    if (debug) {
        if (localVersion) {
            vscode.window.showInformationMessage(`Local Version of the installed ShadeView extension '${extensionId}': ${localVersion}`);
            console.log(
                `Local Version of the installed ShadeView extension '${extensionId}': ${localVersion}`
            );
        }

        if (remoteVersion) {
            vscode.window.showInformationMessage(`Remote Version of the installed ShadeView extension '${extensionId}': ${remoteVersion}`);
            console.log(
                `Remote Version of the installed ShadeView extension '${extensionId}': ${remoteVersion}`
            );
        }
    }

    if (remoteVersion) {
        console.log(`Remote ShadeView version is ${remoteVersion}`);

        const comparisonResult = compareExtensionVersions(
            remoteVersion,
            localVersion
        );

        if (comparisonResult === 1) {
            console.log(`Remote ShadeView Extension: ${remoteVersion} is greater than Local ShadeView Extension ${localVersion}`);
            vscode.window.showInformationMessage(
                `New ShadeView Version ${remoteVersion} is available!`,
                { title: "Get it from Visual Studio Marketplace", id: "market" },
                { title: "Get it from GitHub", id: "github" },
                { title: "Skip Update", id: "skip" }
            )
                .then((e) => {
                    switch (e.id) {
                        case "skip":
                            file.writeFile(t, r, (e) => {
                                e && console.log(e);
                            });
                            break;
                        case "market":
                            open(MARKET_LINK);
                            break;
                        case "github":
                            open(GITHUB_LINK);
                    }
                });
        } else if (comparisonResult === -1) {
            console.log(`ShadeView remote version: ${remoteVersion} is less than: ${localVersion}`);
        } else {
            console.log(`ShadeView local version: ${localVersion} is equal to: ${remoteVersion}`);
        }
    }
}

function showUpdateNotifitionIfNeeds() {
    try {
        requests.default.get(VERSION_URL + "?_" + Math.random()).then(e => {
            e = e.data;
            if (e && e.shadeview) {
                let r = e.shadeview;
                var t, e = Number(r.replace(/\./g, ""));
                Number(VERSION.replace(/\./g, "")) < e && (t = path.join(os.homedir(), ".vscode", "." + e), file.existsSync(t) || vscode.window.showInformationMessage(`New ShadeView Version ${r} is available`, {
                    title: "Get update from VSCode Market",
                    id: "market"
                }, {
                    title: "Get update from GitHub",
                    id: "github"
                }, {
                    title: "Skip This Version",
                    id: "skip"
                }).then(e => {
                    switch (e.id) {
                        case "skip":
                            file.writeFile(t, r, e => {
                                e && console.log(e)
                            });
                            break;
                        case "market":
                            open(MARKET_LINK);
                            break;
                        case "github":
                            open(GITHUB_LINK)
                    }
                }))
            }
        })
    } catch (e) { }
}

function handleRealtimeCommentInput(r) {
    if (r && r.contentChanges && 1 == r.contentChanges.length) {
        let e = r.contentChanges[0].text;
        if (e.startsWith("\n") || e.startsWith("\r\n")) {
            var i = r.contentChanges[0].range;
            let e = r.document,
                t = e.lineAt(i.start);
            if (t.text.trim().startsWith("///")) {
                let r = t.lineNumber + 1;
                var i = e.lineAt(r),
                    o = new vscode.Position(i.lineNumber, i.firstNonWhitespaceCharacterIndex),
                    s = vscode.window.activeTextEditor;
                s && s.edit(e => {
                    e.insert(o, "/// ")
                }).then(() => {
                    var e = new vscode.Position(r, o.character + 4);
                    s.selection = new vscode.Selection(e, e)
                })
            }
        }
    }
}
exports.activate = activate;