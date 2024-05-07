/**
 * Demonstrates how to use vscode-markdown-languageservice to process a markdown file.
 */
// @ts-check
const mdls = require('.');
const MarkdownIt = require('markdown-it');
const { URI } = require('vscode-uri');
const { CancellationTokenSource, Emitter } = require('vscode-languageserver-protocol');
const { TextDocument } = require('vscode-languageserver-textdocument');

// First we need to create the services that the markdown language service depends on.
// This allows vscode-markdown-languageservice to work with as many use cases as possible.

// Create an instance of markdown it to analyze files.
const mdIt = MarkdownIt({ html: true });


const parser = new class {
	slugifier = mdls.githubSlugifier;

	async tokenize(document) {
		return mdIt.parse(document.getText(), {});
	}
};

// Create a virtual document that holds our file content
const myDocument = TextDocument.create(
	URI.file('/path/to/file.md').toString(), // file path
	'markdown', // file language
	1, // version
	[ // File contents
		'# Hello',
		'from **Markdown**',
		'',
		'## World!',
	].join('\n')
);

// Create a simple virtual workspace. This is required as many markdown language features
// operate across files.


const workspace = new class {
	
	get workspaceFolders() {
		return [];
	}

	
	async getAllMarkdownDocuments() {
		return [myDocument];
	}

	hasMarkdownDocument( resource) {
		return resource.toString() === myDocument.uri;
	}

	
	async openMarkdownDocument(resource) {
		if (resource.toString() === myDocument.uri) {
			return myDocument;
		}
		return undefined;
	}

	
	async stat( resource) {
		if (resource.toString() === myDocument.uri) {
			return {};
		}
		return undefined;
	}

	async readDirectory(resource) {
		// Not implemented
		return [];
	}


	
	#onDidChangeMarkdownDocument = new Emitter();
	onDidChangeMarkdownDocument = this.#onDidChangeMarkdownDocument.event;

	
	#onDidCreateMarkdownDocument = new Emitter();
	onDidCreateMarkdownDocument = this.#onDidCreateMarkdownDocument.event;

	
	#onDidDeleteMarkdownDocument = new Emitter();
	onDidDeleteMarkdownDocument = this.#onDidDeleteMarkdownDocument.event;
};


const consoleLogger = {
	log(level, title, message, data) {
		// console.debug(title, message, data);
	},
};

async function main() {
	// Create an instance of the language service the services we just created.
	// You should do this once and then re-use the language service object for subsequent calls.
	const languageService = mdls.createLanguageService({ workspace, parser, logger: consoleLogger });

	// Request document symbols from the language service
	const cts = new CancellationTokenSource();
	try {
		const symbols = await languageService.getDocumentSymbols(myDocument, { includeLinkDefinitions: true }, cts.token);
		console.log(JSON.stringify(symbols, null, 2));
	} finally {
		cts.dispose();
	}
}

main();
