import { Plugin, Editor, MarkdownView, type MarkdownPreviewView } from 'obsidian';

export default class PreviewJKScroll extends Plugin {
    onload() {
        this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
            if (!['j', 'k', 'g', 'G'].includes(evt.key)) return;

            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			const editor = activeView.editor;
			const lastline = editor.lineCount() - 2;

            if (!activeView || activeView.getMode() !== 'preview') return;

            if (evt.target instanceof HTMLElement && (
                evt.target.tagName === 'INPUT' ||
                evt.target.tagName === 'TEXTAREA' ||
                evt.target.isContentEditable
            )) return;

            const preview = activeView.previewMode;
            const now = Date.now();
            
            const scrollAmount = 1;
            const currentScroll = preview.getScroll();
            let newScroll = currentScroll;


			if (evt.key === 'G') {
				preview.applyScroll(lastline);
				evt.preventDefault();
				return;
			}	

            if (evt.key === 'g') {
                if (now - this.lastGPress < 500) { // Double g
                    preview.applyScroll(0);
                    evt.preventDefault();
                    this.lastGPress = 0;
                    return;
                }
                this.lastGPress = now;
            }

            if (evt.key === 'j') {
                newScroll = currentScroll + scrollAmount;
            } else if (evt.key === 'k') {
                newScroll = currentScroll - scrollAmount;
			}
            preview.applyScroll(newScroll);
            evt.preventDefault();
        });
    }
}
