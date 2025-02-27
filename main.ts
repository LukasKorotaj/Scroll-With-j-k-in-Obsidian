import { App, Plugin, MarkdownView, PluginSettingTab, Setting } from 'obsidian';

interface JKMouseScrollSettings {
  scrollSpeed: number;
}

const DEFAULT_SETTINGS: JKMouseScrollSettings = {
  scrollSpeed: 50
};

export default class JKMouseScroll extends Plugin {
  settings: JKMouseScrollSettings;
  private lastGPress = 0;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new JKMouseScrollSettingTab(this.app, this));
    
    this.registerDomEvent(document, 'keydown', this.handleKeyPress);
  }

  onunload() {}

  private handleKeyPress = (event: KeyboardEvent) => {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || activeView.getMode() !== 'preview') return;

    const previewContent = activeView.previewMode.containerEl.querySelector('.markdown-preview-view');
    if (!previewContent) return;

    const now = Date.now();
    const speed = this.settings.scrollSpeed;

    switch (event.key) {
      case 'g':
        if (!event.shiftKey) {
          if (now - this.lastGPress < 500) {
            previewContent.scrollTo({ top: 0, behavior: 'smooth' });
            event.preventDefault();
          }
          this.lastGPress = now;
        }
        break;
      
      case 'G':
        if (event.shiftKey) {
          previewContent.scrollTo({
            top: previewContent.scrollHeight,
            behavior: 'smooth'
          });
          event.preventDefault();
        }
        break;

      case 'j':
        previewContent.scrollBy({ top: speed, behavior: 'smooth' });
        event.preventDefault();
        break;

      case 'k':
        previewContent.scrollBy({ top: -speed, behavior: 'smooth' });
        event.preventDefault();
        break;
    }
  };

  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class JKMouseScrollSettingTab extends PluginSettingTab {
  plugin: JKMouseScroll;

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Scroll speed')
      .setDesc('Pixels to scroll per keypress (default: 50)')
      .addText(text => text
        .setPlaceholder('50')
        .setValue(this.plugin.settings.scrollSpeed.toString())
        .onChange(async value => {
          this.plugin.settings.scrollSpeed = parseInt(value) || 50;
          await this.plugin.saveSettings();
        }));
  }
}
