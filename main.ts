import { Plugin, MarkdownView } from 'obsidian';

export default class PreviewJKScroll extends Plugin {
	private lastGPress = 0;

	onload() {
		this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
			if (!['j', 'k', 'g', 'G'].includes(evt.key)) return;

			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView || activeView.getMode() !== 'preview') return;

			if (
				evt.target instanceof HTMLElement &&
				(evt.target.tagName === 'INPUT' ||
					evt.target.tagName === 'TEXTAREA' ||
					evt.target.isContentEditable)
			) {
				return;
			}

			const preview = activeView.previewMode;
			const now = Date.now();

			if (evt.key === 'G') {
				const lastLine = activeView.editor.lineCount() - 2;
				preview.applyScroll(lastLine);
				evt.preventDefault();
				return;
			}

			if (evt.key === 'g') {
				if (now - this.lastGPress < 500) {
					preview.applyScroll(0);
					evt.preventDefault();
					this.lastGPress = 0;
					return;
				}
				this.lastGPress = now;
			}

			const scrollAmount = 1;
			const currentScroll = preview.getScroll();
			const newScroll =
				evt.key === 'j'
					? currentScroll + scrollAmount
					: evt.key === 'k'
					? currentScroll - scrollAmount
					: currentScroll;

			preview.applyScroll(newScroll);
			evt.preventDefault();
		});
	}

	onunload() {
	}
}

