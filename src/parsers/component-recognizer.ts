import { FigmaNode } from '../types/figma';
import { ComponentType, ComponentCategory } from '../types/generator';

export class ComponentRecognizer {
  private buttonKeywords = ['button', 'btn', 'cta', 'submit', 'action', 'click'];
  private inputKeywords = ['input', 'field', 'textbox', 'textarea', 'search', 'form'];
  private cardKeywords = ['card', 'tile', 'panel', 'item', 'product', 'post'];
  private navigationKeywords = ['nav', 'menu', 'header', 'footer', 'sidebar', 'breadcrumb'];
  private modalKeywords = ['modal', 'dialog', 'popup', 'overlay', 'drawer'];
  private layoutKeywords = ['container', 'wrapper', 'section', 'grid', 'layout', 'frame'];
  private typographyKeywords = ['title', 'heading', 'text', 'label', 'caption', 'subtitle'];
  private mediaKeywords = ['image', 'img', 'icon', 'avatar', 'photo', 'picture'];

  /**
   * Determine if a node represents a recognizable component
   */
  isRecognizableComponent(node: FigmaNode): boolean {
    const name = node.name.toLowerCase();
    
    // Check if it's explicitly a component
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      return true;
    }

    // Check if it has component-like characteristics
    return this.hasComponentCharacteristics(node) ||
           this.matchesComponentPattern(name) ||
           this.hasInteractiveElements(node);
  }

  /**
   * Determine if a component pattern is reusable
   */
  isReusablePattern(node: FigmaNode): boolean {
    const name = node.name.toLowerCase();
    
    // Components that are typically reusable
    const reusablePatterns = [
      ...this.buttonKeywords,
      ...this.inputKeywords,
      ...this.cardKeywords,
      'badge', 'chip', 'tag', 'pill',
      'tooltip', 'popover', 'dropdown',
      'tab', 'accordion', 'collapse',
      'slider', 'toggle', 'switch',
      'checkbox', 'radio', 'select',
      'loader', 'spinner', 'progress',
      'alert', 'notification', 'toast',
      'avatar', 'icon', 'logo',
      'list-item', 'table-row', 'table-cell'
    ];

    return reusablePatterns.some(pattern => name.includes(pattern)) ||
           this.hasReusableStructure(node);
  }

  /**
   * Get component type based on analysis
   */
  getComponentType(node: FigmaNode): ComponentType {
    const name = node.name.toLowerCase();
    const hasChildren = node.children && node.children.length > 0;
    const hasText = this.hasTextChild(node);
    const hasImages = this.hasImageChild(node);

    // Layout components
    if (this.matchesKeywords(name, this.layoutKeywords) || this.isLayoutContainer(node)) {
      return 'layout';
    }

    // Interactive components
    if (this.matchesKeywords(name, [...this.buttonKeywords, ...this.inputKeywords, ...this.modalKeywords])) {
      return 'interactive';
    }

    // Navigation components
    if (this.matchesKeywords(name, this.navigationKeywords)) {
      return 'navigation';
    }

    // Typography components
    if (node.type === 'TEXT' || this.matchesKeywords(name, this.typographyKeywords)) {
      return 'typography';
    }

    // Media components
    if (this.matchesKeywords(name, this.mediaKeywords) || hasImages) {
      return 'media';
    }

    // UI components (default for interactive elements)
    if (hasChildren && (hasText || this.hasInteractiveElements(node))) {
      return 'ui';
    }

    // Form components
    if (this.isFormComponent(node)) {
      return 'form';
    }

    // Data display components
    if (this.isDataDisplayComponent(node)) {
      return 'data-display';
    }

    // Feedback components
    if (this.isFeedbackComponent(node)) {
      return 'feedback';
    }

    // Default to UI
    return 'ui';
  }

  /**
   * Get specific component category
   */
  getComponentCategory(node: FigmaNode): ComponentCategory {
    const name = node.name.toLowerCase();

    // Button variations
    if (this.matchesKeywords(name, this.buttonKeywords)) {
      return 'button';
    }

    // Input variations
    if (this.matchesKeywords(name, this.inputKeywords)) {
      if (name.includes('textarea')) return 'textarea';
      if (name.includes('select') || name.includes('dropdown')) return 'select';
      if (name.includes('checkbox')) return 'checkbox';
      if (name.includes('radio')) return 'radio';
      if (name.includes('date')) return 'datepicker';
      return 'input';
    }

    // Card variations
    if (this.matchesKeywords(name, this.cardKeywords)) {
      return 'card';
    }

    // Navigation variations
    if (this.matchesKeywords(name, this.navigationKeywords)) {
      if (name.includes('header')) return 'header';
      if (name.includes('footer')) return 'footer';
      if (name.includes('sidebar')) return 'sidebar';
      return 'navigation';
    }

    // Modal variations
    if (this.matchesKeywords(name, this.modalKeywords)) {
      return 'modal';
    }

    // Layout variations
    if (this.matchesKeywords(name, this.layoutKeywords)) {
      return 'container';
    }

    // Typography variations
    if (node.type === 'TEXT' || this.matchesKeywords(name, this.typographyKeywords)) {
      return 'text';
    }

    // Media variations
    if (this.matchesKeywords(name, this.mediaKeywords)) {
      if (name.includes('icon')) return 'icon';
      if (name.includes('avatar')) return 'icon';
      return 'image';
    }

    // Specific UI components
    if (name.includes('badge') || name.includes('chip') || name.includes('tag')) return 'badge';
    if (name.includes('tooltip') || name.includes('popover')) return 'tooltip';
    if (name.includes('alert') || name.includes('notification')) return 'alert';
    if (name.includes('loader') || name.includes('spinner')) return 'loader';
    if (name.includes('progress')) return 'progress';
    if (name.includes('slider')) return 'slider';
    if (name.includes('toggle') || name.includes('switch')) return 'toggle';
    if (name.includes('tab')) return 'tabs';
    if (name.includes('accordion')) return 'accordion';
    if (name.includes('carousel')) return 'carousel';
    if (name.includes('table')) return 'table';
    if (name.includes('list')) return 'list';
    if (name.includes('form')) return 'form';
    if (name.includes('link')) return 'link';

    // Default
    return 'other';
  }

  /**
   * Check if node has component-like characteristics
   */
  private hasComponentCharacteristics(node: FigmaNode): boolean {
    // Has children and reasonable size
    const hasChildren = node.children && node.children.length > 0;
    const hasReasonableSize = node.absoluteBoundingBox && 
                             node.absoluteBoundingBox.width > 20 && 
                             node.absoluteBoundingBox.height > 20;

    // Has styling that suggests it's a component
    const hasBackground = node.fills && node.fills.length > 0;
    const hasBorder = node.strokes && node.strokes.length > 0;
    const hasCornerRadius = node.cornerRadius && node.cornerRadius > 0;
    const hasShadow = node.effects && node.effects.some(e => e.type === 'DROP_SHADOW');

    // Has layout properties
    const hasLayoutMode = node.layoutMode && node.layoutMode !== 'NONE';
    const hasPadding = node.paddingLeft || node.paddingRight || 
                      node.paddingTop || node.paddingBottom;

    return hasChildren && hasReasonableSize && 
           (hasBackground || hasBorder || hasCornerRadius || hasShadow || hasLayoutMode || hasPadding);
  }

  /**
   * Check if name matches component patterns
   */
  private matchesComponentPattern(name: string): boolean {
    const allKeywords = [
      ...this.buttonKeywords,
      ...this.inputKeywords,
      ...this.cardKeywords,
      ...this.navigationKeywords,
      ...this.modalKeywords,
      ...this.layoutKeywords,
      ...this.typographyKeywords,
      ...this.mediaKeywords
    ];

    return allKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Check if node has interactive elements
   */
  private hasInteractiveElements(node: FigmaNode): boolean {
    if (!node.children) return false;

    return node.children.some(child => {
      const childName = child.name.toLowerCase();
      return this.matchesKeywords(childName, [...this.buttonKeywords, ...this.inputKeywords]) ||
             child.type === 'INSTANCE' ||
             this.hasInteractiveElements(child);
    });
  }

  /**
   * Check if node has reusable structure
   */
  private hasReusableStructure(node: FigmaNode): boolean {
    // Small, self-contained components
    const bounds = node.absoluteBoundingBox;
    if (bounds && bounds.width < 400 && bounds.height < 200) {
      return this.hasComponentCharacteristics(node);
    }

    // Components with consistent naming patterns
    const name = node.name;
    const hasVersionSuffix = /\s+(v\d+|\d+\.\d+)$/i.test(name);
    const hasStateSuffix = /\s+(default|hover|active|disabled|selected)$/i.test(name);
    const hasVariantSuffix = /\s+(primary|secondary|large|small|dark|light)$/i.test(name);

    return hasVersionSuffix || hasStateSuffix || hasVariantSuffix;
  }

  /**
   * Check if node is a layout container
   */
  private isLayoutContainer(node: FigmaNode): boolean {
    if (node.type !== 'FRAME') return false;

    const hasLayoutMode = node.layoutMode && node.layoutMode !== 'NONE';
    const hasMultipleChildren = node.children && node.children.length > 1;
    const isLargeContainer = node.absoluteBoundingBox && 
                            (node.absoluteBoundingBox.width > 300 || 
                             node.absoluteBoundingBox.height > 200);

    return hasLayoutMode && hasMultipleChildren && isLargeContainer;
  }

  /**
   * Check if node is a form component
   */
  private isFormComponent(node: FigmaNode): boolean {
    const name = node.name.toLowerCase();
    const formKeywords = ['form', 'input', 'field', 'label', 'submit', 'reset', 'validate'];
    return this.matchesKeywords(name, formKeywords) || this.hasFormElements(node);
  }

  /**
   * Check if node is a data display component
   */
  private isDataDisplayComponent(node: FigmaNode): boolean {
    const name = node.name.toLowerCase();
    const dataKeywords = ['table', 'list', 'grid', 'chart', 'graph', 'data', 'stat', 'metric'];
    return this.matchesKeywords(name, dataKeywords);
  }

  /**
   * Check if node is a feedback component
   */
  private isFeedbackComponent(node: FigmaNode): boolean {
    const name = node.name.toLowerCase();
    const feedbackKeywords = ['alert', 'notification', 'toast', 'snackbar', 'banner', 'message'];
    return this.matchesKeywords(name, feedbackKeywords);
  }

  /**
   * Check if node has text children
   */
  private hasTextChild(node: FigmaNode): boolean {
    if (!node.children) return false;
    return node.children.some(child => 
      child.type === 'TEXT' || this.hasTextChild(child)
    );
  }

  /**
   * Check if node has image children
   */
  private hasImageChild(node: FigmaNode): boolean {
    if (!node.children) return false;
    return node.children.some(child => 
      this.isImageNode(child) || this.hasImageChild(child)
    );
  }

  /**
   * Check if node has form elements
   */
  private hasFormElements(node: FigmaNode): boolean {
    if (!node.children) return false;
    return node.children.some(child => {
      const childName = child.name.toLowerCase();
      return this.matchesKeywords(childName, this.inputKeywords) ||
             this.hasFormElements(child);
    });
  }

  /**
   * Check if node is an image
   */
  private isImageNode(node: FigmaNode): boolean {
    if (node.fills) {
      return node.fills.some(fill => fill.type === 'IMAGE');
    }
    return false;
  }

  /**
   * Check if name matches any of the keywords
   */
  private matchesKeywords(name: string, keywords: string[]): boolean {
    return keywords.some(keyword => name.includes(keyword));
  }
}