import * as vscode from 'vscode'

let registration: any
let tokenRegex = /(?:\/\/|#)[^\n]*[\n\r]*|\/\*(?:\n|\r|.)*?\*\/|"(?:[^"\\]*(?:\\.[^"\\]*)*)"|'(?:[^'\\]*(?:\\.[^'\\]*)*)'|(?<BEGIN>\<(?:\?|%)=|(?:\<\?php|\<\?|\<%)\s?)|(?<END>\?\>|%\>)/g

function checkPosition(text: string, offset: number) {
	let match: any
	let isPHP = false
	while ((match = tokenRegex.exec(text))) {
		let start = match.index
		let end = match.index + match[0].length
		// console.log({match, start, end, offset});
		if (offset < start) {
			tokenRegex.lastIndex = 0
			break
		}
		if (match.groups.BEGIN) {
			isPHP = true
			// console.log('BEGIN')
		} else if (match.groups.END) {
			isPHP = false
			// console.log('END')
		} else if (match[0] && isPHP) {
			if (offset > start && offset <= end) {
				// console.log('HERE NOT allowed (found)')
				tokenRegex.lastIndex = 0
				return false
			}
		}
	}
	// if (isPHP) console.log('HERE allowed (NOT found)')
	// else console.log('HERE NOT allowed')
	return isPHP
}

export function activate(context: vscode.ExtensionContext) {
	//console.clear()
	//console.log('READY!')
	registration = vscode.workspace.onDidChangeTextDocument(event => {
		const changes = event.contentChanges[0]
		const text = changes.text
		const doc = event.document
		if (doc.languageId !== 'php' || !changes.range.isSingleLine) {
			return true
		}
		if (text === '-') {
			const { line, character } = changes.range.start
			const position = new vscode.Position(line, character)
			if (!checkPosition(doc.getText(), doc.offsetAt(position))) {
				return true
			}
			const editor = vscode.window.activeTextEditor
			const prevPosition = new vscode.Position(line, character - 1)
			const newPosition = new vscode.Position(line, character + 1)
			const nextPosition = new vscode.Position(line, character + 2)
			const nextText = doc.getText(new vscode.Range(newPosition, nextPosition))
			const prevText = doc.getText(new vscode.Range(prevPosition, position))

			let allowForPreviousWord = false
			const prevWordRange = doc.getWordRangeAtPosition(position)
			const prevWord = doc.getText(prevWordRange)
			if (prevWordRange && !/^[\d+]$/.test(prevWord)) {
				allowForPreviousWord = true
			} else {
				allowForPreviousWord = prevText == ')'
			}
			if (nextText !== '>' && allowForPreviousWord) {
				editor?.edit(TextEditorEdit => {
					TextEditorEdit.insert(newPosition, '>')
				})
			}
		}
		if (text === '=') {
			const { line, character } = changes.range.start
			const currPosition = new vscode.Position(line, character)
			if (!checkPosition(doc.getText(), doc.offsetAt(currPosition))) {
				return true
			}
			const editor = vscode.window.activeTextEditor
			const startPosition = new vscode.Position(line, 0)
			const prevText = doc
				.getText(new vscode.Range(startPosition, currPosition))
				.trim()
			const prevChar = prevText.slice(-1)

			if (prevChar == '"' || prevChar == "'") {
				const newPosition = new vscode.Position(line, character + 1)
				const nextPosition = new vscode.Position(line, character + 2)
				const nextText = doc.getText(
					new vscode.Range(newPosition, nextPosition)
				)
				if (nextText !== '>') {
					editor?.edit(TextEditorEdit => {
						TextEditorEdit.insert(newPosition, '>')
					})
				}
			}
		}
	})
}

export function deactivate() {
	if (registration) {
		registration.dispose()
	}
}
