import { App, Plugin, MarkdownView, PluginSettingTab, Setting } from 'obsidian';

interface JKMouseScrollSettings {
  scrollSpeed: number;
  repeatInterval: number;
}

const DEFAULT_SETTINGS: JKMouseScrollSettings = {
  scrollSpeed: 10,
  repeatInterval: 5
};

export default class JKMouseScroll extends Plugin {
  settings: JKMouseScrollSettings;
  private lastGPress = 0;
  private intervalId: number | null = null;
  private currentKey: string | null = null;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new JKMouseScrollSettingTab(this.app, this));
    
    this.registerDomEvent(document, 'keydown', this.handleKeyDown);
    this.registerDomEvent(document, 'keyup', this.handleKeyUp);
  }

  onunload() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
    }
  }

  private getPreviewContent(): Element | null {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || activeView.getMode() !== 'preview') return null;
    return activeView.previewMode.containerEl.querySelector('.markdown-preview-view');
  }

  private shouldHandleKeys(): boolean {
    const activeEl = document.activeElement;
    
    if (document.querySelector('.modal')) return false;

    if (activeEl) {
      const tagName = activeEl.tagName.toLowerCase();
      const isEditable = tagName === 'input' || 
                        tagName === 'textarea' || 
                        (activeEl as HTMLElement).isContentEditable;
      if (isEditable) return false;
    }

    const previewContent = this.getPreviewContent();
    return !!previewContent && previewContent.contains(activeEl);
  }

  private scrollOnce(previewContent: Element, key: string, isRepeat: boolean) {
    const speed = this.settings.scrollSpeed;
    if (key === 'j') {
      if (isRepeat) {
        previewContent.scrollTop += speed;
      } else {
        previewContent.scrollBy({ top: speed, behavior: 'smooth' });
      }
    } else if (key === 'k') {
      if (isRepeat) {
        previewContent.scrollTop -= speed;
      } else {
        previewContent.scrollBy({ top: -speed, behavior: 'smooth' });
      }
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.shouldHandleKeys()) return;

    const previewContent = this.getPreviewContent();
    if (!previewContent) return;

    const now = Date.now();
    const key = event.key.toLowerCase();

    if (key === 'g') {
      if (event.shiftKey) {
        previewContent.scrollTo({
          top: previewContent.scrollHeight,
          behavior: 'smooth'
        });
        event.preventDefault();
      } else {
        if (now - this.lastGPress < 500) {
          previewContent.scrollTo({ top: 0, behavior: 'smooth' });
          event.preventDefault();
        }
        this.lastGPress = now;
      }
    }

    if (key === 'j' || key === 'k') {
      if (!event.repeat && this.intervalId === null) {
        this.currentKey = key;
        this.scrollOnce(previewContent, key, false);
        this.intervalId = window.setInterval(() => {
          if (!this.shouldHandleKeys()) {
            window.clearInterval(this.intervalId!);
            this.intervalId = null;
            this.currentKey = null;
            return;
          }
          const pc = this.getPreviewContent();
          if (pc && this.currentKey) {
            this.scrollOnce(pc, this.currentKey, true);
          }
        }, this.settings.repeatInterval);
      }
      event.preventDefault();
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if ((key === 'j' || key === 'k') && key === this.currentKey) {
      if (this.intervalId !== null) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
        this.currentKey = null;
      }
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
      .setDesc('Pixels to scroll per keypress (default: 10)')
      .addText(text => text
        .setPlaceholder('10')
        .setValue(this.plugin.settings.scrollSpeed.toString())
        .onChange(async value => {
          this.plugin.settings.scrollSpeed = parseInt(value) || 50;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Repeat interval')
      .setDesc('Milliseconds between scroll steps when holding keys; the recommended value is 5')
      .addText(text => text
        .setPlaceholder('5')
        .setValue(this.plugin.settings.repeatInterval.toString())
        .onChange(async value => {
          this.plugin.settings.repeatInterval = parseInt(value) || 50;
          await this.plugin.saveSettings();
        }));
  }
}
