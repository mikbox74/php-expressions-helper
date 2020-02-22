import * as vscode from "vscode";

let registration: any;

export function activate(context: vscode.ExtensionContext) {
	registration = vscode.workspace.onDidChangeTextDocument(event => {
		const changes = event.contentChanges[0];
		const text = changes.text;
		if (!changes.range.isSingleLine) {
			return true;
		}
		if (text === "-") {
			const doc = event.document;
			const editor = vscode.window.activeTextEditor;
			const { line, character } = changes.range.start;
			const prevPosition = new vscode.Position(line, character - 1);
			const position = new vscode.Position(line, character);
			const newPosition = new vscode.Position(line, character + 1);
			const nextPosition = new vscode.Position(line, character + 2);
			const nextText = doc.getText(new vscode.Range(newPosition, nextPosition));
			const prevText = doc.getText(new vscode.Range(prevPosition, position));

			let allowForPreviousWord = false;
			const prevWordRange = doc.getWordRangeAtPosition(position);
			const prevWord = doc.getText(prevWordRange);
			if (prevWordRange && !/^[\d+]$/.test(prevWord)) {
				allowForPreviousWord = true;
			} else {
				allowForPreviousWord = prevText == ")";
			}
			if (nextText !== ">" && allowForPreviousWord) {
				editor?.edit(TextEditorEdit => {
					TextEditorEdit.insert(newPosition, ">");
				});
			}
		}
		if (text === "=") {
			const doc = event.document;
			const editor = vscode.window.activeTextEditor;
			const { line, character } = changes.range.start;
			const startPosition = new vscode.Position(line, 0);
			const currPosition  = new vscode.Position(line, character);
			const prevText = doc.getText(new vscode.Range(startPosition, currPosition)).trim();
			const prevChar = prevText.slice(-1);

			if (prevChar == '"' || prevChar == "'") {
				const newPosition = new vscode.Position(line, character + 1);
				const nextPosition = new vscode.Position(line, character + 2);
				const nextText = doc.getText(new vscode.Range(newPosition, nextPosition));
				if (nextText !== ">") {
					editor?.edit(TextEditorEdit => {
						TextEditorEdit.insert(newPosition, ">");
					});
				}
			}
		}
	});
}

export function deactivate() { 
	if (registration) {
		registration.dispose();
	}
}
