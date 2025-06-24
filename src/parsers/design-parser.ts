import { FigmaNode, FigmaFile, Color, Paint, TypeStyle } from '../types/figma';
import {
  ParsedDesign,
  ParsedComponent,
  ParsedElement,
  ParsedStyleSystem,
  ComputedStyles,
  ComponentType,
  ComponentCategory,
  ElementType,
  LayoutStyles,
  TypographyStyles,
  ColorStyles,
  SpacingStyles,
  BorderStyles,
  ShadowStyles,
  EffectStyles,
  AccessibilityConfig,
  ComponentProp,
  PropType,
  PositionConfig,
  ConstraintConfig,
  ParsedPage,
  ParsedAsset,
  DesignMetadata,
  ColorSystem,
  TypographySystem,
  SpacingSystem,
  ShadowSystem,
  BorderSystem,
  EffectSystem
} from '../types/generator';
import { ComponentRecognizer } from './component-recognizer';
import { StyleExtractor } from './style-extractor';
import { LayoutAnalyzer } from './layout-analyzer';

export class DesignParser {
  private componentRecognizer: ComponentRecognizer;
  private styleExtractor: StyleExtractor;
  private layoutAnalyzer: LayoutAnalyzer;

  constructor() {
    this.componentRecognizer = new ComponentRecognizer();
    this.styleExtractor = new StyleExtractor();
    this.layoutAnalyzer = new LayoutAnalyzer();
  }

  /**
   * Parse entire Figma file into structured design data
   */
  async parseDesign(file: FigmaFile, fileKey: string): Promise<ParsedDesign> {
    console.log(`🔍 Parsing design: ${file.name}`);

    const startTime = Date.now();

    // Extract style system first
    const styles = this.extractStyleSystem(file);

    // Parse pages
    const pages = this.parsePages(file.document.children || []);

    // Extract components
    const components = this.extractComponents(file, styles);

    // Extract assets
    const assets = this.extractAssets(file);

    // Create metadata
    const metadata: DesignMetadata = {
      fileKey,
      fileName: file.name,
      version: file.version,
      lastModified: file.lastModified,
      figmaUrl: `https://www.figma.com/file/${fileKey}`,
      exportTime: new Date().toISOString(),
      generator: '@figma-to-react/code-generator v1.0.0'
    };

    const parseTime = Date.now() - startTime;
    console.log(`✅ Design parsed in ${parseTime}ms`);

    return {
      name: file.name,
      components,
      pages,
      styles,
      assets,
      metadata
    };
  }

  /**
   * Parse individual pages
   */
  private parsePages(canvasNodes: FigmaNode[]): ParsedPage[] {
    return canvasNodes.map(canvas => ({
      id: canvas.id,
      name: canvas.name,
      components: this.parsePageComponents(canvas.children || []),
      layout: {
        type: 'responsive',
        maxWidth: '1200px',
        breakpoints: {
          xs: '320px',
          sm: '768px',
          md: '1024px',
          lg: '1280px',
          xl: '1920px'
        }
      }
    }));
  }

  /**
   * Parse components within a page
   */
  private parsePageComponents(nodes: FigmaNode[]): ParsedComponent[] {
    const components: ParsedComponent[] = [];

    for (const node of nodes) {
      if (this.isComponent(node)) {
        const component = this.parseComponent(node);
        if (component) {
          components.push(component);
        }
      }
    }

    return components;
  }

  /**
   * Parse individual component
   */
  private parseComponent(node: FigmaNode): ParsedComponent | null {
    try {
      const type = this.componentRecognizer.getComponentType(node);
      const category = this.componentRecognizer.getComponentCategory(node);
      const props = this.extractComponentProps(node);
      const children = this.parseElements(node.children || []);
      const styles = this.styleExtractor.computeStyles(node);
      const accessibility = this.extractAccessibilityConfig(node);

      return {
        id: node.id,
        name: this.sanitizeComponentName(node.name),
        type,
        category,
        props,
        children,
        styles,
        accessibility,
        reusable: this.isReusableComponent(node),
        description: this.extractDescription(node)
      };
    } catch (error) {
      console.warn(`⚠️ Failed to parse component ${node.name}:`, error);
      return null;
    }
  }

  /**
   * Parse child elements recursively
   */
  private parseElements(nodes: FigmaNode[]): ParsedElement[] {
    return nodes.map(node => this.parseElement(node)).filter(Boolean) as ParsedElement[];
  }

  /**
   * Parse individual element
   */
  private parseElement(node: FigmaNode): ParsedElement | null {
    try {
      const type = this.getElementType(node);
      const tagName = this.getElementTagName(node);
      const content = this.extractElementContent(node);
      const children = this.parseElements(node.children || []);
      const styles = this.styleExtractor.computeStyles(node);
      const props = this.extractElementProps(node);
      const accessibility = this.extractAccessibilityConfig(node);
      const position = this.extractPositionConfig(node);
      const constraints = this.extractConstraintConfig(node);

      return {
        id: node.id,
        name: this.sanitizeElementName(node.name),
        type,
        tagName,
        content,
        children,
        styles,
        props,
        accessibility,
        position,
        constraints
      };
    } catch (error) {
      console.warn(`⚠️ Failed to parse element ${node.name}:`, error);
      return null;
    }
  }

  /**
   * Extract comprehensive style system
   */
  private extractStyleSystem(file: FigmaFile): ParsedStyleSystem {
    const colorSystem = this.extractColorSystem(file);
    const typographySystem = this.extractTypographySystem(file);
    const spacingSystem = this.extractSpacingSystem(file);
    const shadowSystem = this.extractShadowSystem(file);
    const borderSystem = this.extractBorderSystem(file);
    const effectSystem = this.extractEffectSystem(file);

    return {
      colors: colorSystem,
      typography: typographySystem,
      spacing: spacingSystem,
      shadows: shadowSystem,
      borders: borderSystem,
      effects: effectSystem
    };
  }

  /**
   * Extract color system from design
   */
  private extractColorSystem(file: FigmaFile): ColorSystem {
    const colors = new Set<string>();
    
    // Extract colors from styles
    Object.values(file.styles || {}).forEach(style => {
      if (style.styleType === 'FILL') {
        // Extract color from style
      }
    });

    // Extract colors from nodes
    this.traverseNodes(file.document, (node) => {
      if (node.fills) {
        node.fills.forEach(fill => {
          if (fill.type === 'SOLID' && fill.color) {
            colors.add(this.colorToHex(fill.color));
          }
        });
      }
    });

    // Generate color system
    const colorArray = Array.from(colors);
    
    return {
      primary: this.generateColorPalette(colorArray[0] || '#000000'),
      secondary: this.generateColorPalette(colorArray[1] || '#666666'),
      neutral: this.generateColorPalette('#888888'),
      semantic: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
      },
      custom: colorArray.reduce((acc, color, index) => {
        acc[`color-${index + 1}`] = color;
        return acc;
      }, {} as Record<string, string>)
    };
  }

  /**
   * Extract typography system
   */
  private extractTypographySystem(file: FigmaFile): TypographySystem {
    const fontFamilies = new Set<string>();
    const fontSizes = new Set<number>();
    const fontWeights = new Set<number>();
    const lineHeights = new Set<number>();
    const letterSpacings = new Set<number>();

    this.traverseNodes(file.document, (node) => {
      if (node.type === 'TEXT' && node.style) {
        fontFamilies.add(node.style.fontFamily);
        fontSizes.add(node.style.fontSize);
        fontWeights.add(node.style.fontWeight);
        lineHeights.add(node.style.lineHeightPx);
        letterSpacings.add(node.style.letterSpacing);
      }
    });

    return {
      fontFamilies: {
        sans: Array.from(fontFamilies)[0] || 'Inter, system-ui, sans-serif',
        serif: 'Georgia, serif',
        mono: 'Menlo, Monaco, monospace'
      },
      fontSizes: this.generateFontSizes(Array.from(fontSizes)),
      fontWeights: this.generateFontWeights(Array.from(fontWeights)),
      lineHeights: this.generateLineHeights(Array.from(lineHeights)),
      letterSpacings: this.generateLetterSpacings(Array.from(letterSpacings)),
      textStyles: {}
    };
  }

  /**
   * Extract spacing system
   */
  private extractSpacingSystem(file: FigmaFile): SpacingSystem {
    const spacings = new Set<number>();

    this.traverseNodes(file.document, (node) => {
      if (node.paddingLeft !== undefined) spacings.add(node.paddingLeft);
      if (node.paddingRight !== undefined) spacings.add(node.paddingRight);
      if (node.paddingTop !== undefined) spacings.add(node.paddingTop);
      if (node.paddingBottom !== undefined) spacings.add(node.paddingBottom);
      if (node.itemSpacing !== undefined) spacings.add(node.itemSpacing);
    });

    const spacingArray = Array.from(spacings).sort((a, b) => a - b);

    return {
      scale: this.generateSpacingScale(spacingArray),
      semantic: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px'
      }
    };
  }

  /**
   * Extract shadow system
   */
  private extractShadowSystem(file: FigmaFile): ShadowSystem {
    const shadows = new Set<string>();

    this.traverseNodes(file.document, (node) => {
      if (node.effects) {
        node.effects.forEach(effect => {
          if (effect.type === 'DROP_SHADOW' && effect.visible !== false) {
            const shadow = this.effectToBoxShadow(effect);
            if (shadow) shadows.add(shadow);
          }
        });
      }
    });

    return {
      elevation: this.generateElevationScale(Array.from(shadows)),
      colored: {},
      inset: {}
    };
  }

  /**
   * Extract border system
   */
  private extractBorderSystem(file: FigmaFile): BorderSystem {
    const borderWidths = new Set<number>();
    const borderRadii = new Set<number>();

    this.traverseNodes(file.document, (node) => {
      if (node.strokeWeight !== undefined) borderWidths.add(node.strokeWeight);
      if (node.cornerRadius !== undefined) borderRadii.add(node.cornerRadius);
    });

    return {
      widths: this.generateBorderWidths(Array.from(borderWidths)),
      styles: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
        none: 'none'
      },
      radii: this.generateBorderRadii(Array.from(borderRadii))
    };
  }

  /**
   * Extract effect system
   */
  private extractEffectSystem(file: FigmaFile): EffectSystem {
    return {
      blur: {
        none: 'blur(0)',
        sm: 'blur(4px)',
        md: 'blur(8px)',
        lg: 'blur(16px)',
        xl: 'blur(24px)'
      },
      brightness: {
        dim: 'brightness(0.8)',
        normal: 'brightness(1)',
        bright: 'brightness(1.2)'
      },
      contrast: {
        low: 'contrast(0.8)',
        normal: 'contrast(1)',
        high: 'contrast(1.2)'
      },
      opacity: {
        invisible: 0,
        faint: 0.1,
        light: 0.25,
        medium: 0.5,
        heavy: 0.75,
        opaque: 1
      }
    };
  }

  /**
   * Extract all components from the file
   */
  private extractComponents(file: FigmaFile, styles: ParsedStyleSystem): ParsedComponent[] {
    const components: ParsedComponent[] = [];
    
    this.traverseNodes(file.document, (node) => {
      if (this.isComponent(node)) {
        const component = this.parseComponent(node);
        if (component) {
          components.push(component);
        }
      }
    });

    return components;
  }

  /**
   * Extract assets from the file
   */
  private extractAssets(file: FigmaFile): ParsedAsset[] {
    const assets: ParsedAsset[] = [];
    
    this.traverseNodes(file.document, (node) => {
      if (node.type === 'RECTANGLE' && node.fills) {
        node.fills.forEach(fill => {
          if (fill.type === 'IMAGE' && fill.imageRef) {
            assets.push({
              id: fill.imageRef,
              name: `${node.name}-image`,
              type: 'image',
              url: '', // Will be populated by image API
              format: 'png'
            });
          }
        });
      }
    });

    return assets;
  }

  // Helper methods

  private isComponent(node: FigmaNode): boolean {
    return node.type === 'COMPONENT' || 
           node.type === 'FRAME' || 
           node.type === 'COMPONENT_SET' ||
           this.componentRecognizer.isRecognizableComponent(node);
  }

  private isReusableComponent(node: FigmaNode): boolean {
    return node.type === 'COMPONENT' || 
           node.type === 'COMPONENT_SET' ||
           this.componentRecognizer.isReusablePattern(node);
  }

  private getElementType(node: FigmaNode): ElementType {
    switch (node.type) {
      case 'TEXT': return 'text';
      case 'RECTANGLE': 
      case 'ELLIPSE': 
      case 'VECTOR': return 'shape';
      case 'FRAME': return 'container';
      case 'INSTANCE': return 'interactive';
      default: return 'container';
    }
  }

  private getElementTagName(node: FigmaNode): string {
    switch (node.type) {
      case 'TEXT': return this.getTextTag(node);
      case 'FRAME': return 'div';
      case 'RECTANGLE': return 'div';
      case 'ELLIPSE': return 'div';
      case 'VECTOR': return 'svg';
      case 'INSTANCE': return 'div';
      default: return 'div';
    }
  }

  private getTextTag(node: FigmaNode): string {
    const name = node.name.toLowerCase();
    if (name.includes('h1') || name.includes('heading 1')) return 'h1';
    if (name.includes('h2') || name.includes('heading 2')) return 'h2';
    if (name.includes('h3') || name.includes('heading 3')) return 'h3';
    if (name.includes('h4') || name.includes('heading 4')) return 'h4';
    if (name.includes('h5') || name.includes('heading 5')) return 'h5';
    if (name.includes('h6') || name.includes('heading 6')) return 'h6';
    if (name.includes('title')) return 'h1';
    if (name.includes('subtitle')) return 'h2';
    if (name.includes('label')) return 'label';
    if (name.includes('caption')) return 'figcaption';
    return 'p';
  }

  private extractElementContent(node: FigmaNode): string | undefined {
    return node.type === 'TEXT' ? node.characters : undefined;
  }

  private extractComponentProps(node: FigmaNode): ComponentProp[] {
    const props: ComponentProp[] = [];
    
    // Extract props from component variants
    if (node.type === 'COMPONENT_SET') {
      // Handle component set variants
    }
    
    // Extract common props
    if (node.visible !== undefined) {
      props.push({
        name: 'visible',
        type: 'boolean',
        defaultValue: node.visible,
        required: false
      });
    }

    return props;
  }

  private extractElementProps(node: FigmaNode): any[] {
    const props: any[] = [];
    
    if (node.type === 'TEXT' && node.characters) {
      props.push({
        name: 'children',
        value: node.characters,
        type: 'string' as PropType
      });
    }

    return props;
  }

  private extractAccessibilityConfig(node: FigmaNode): AccessibilityConfig | undefined {
    const config: AccessibilityConfig = {};
    
    // Extract semantic meaning from name
    const name = node.name.toLowerCase();
    
    if (name.includes('button')) {
      config.role = 'button';
      config.focusable = true;
    } else if (name.includes('input')) {
      config.role = 'textbox';
      config.focusable = true;
    } else if (name.includes('heading') || /^h[1-6]/.test(name)) {
      config.role = 'heading';
    } else if (name.includes('image') || name.includes('img')) {
      config.alt = this.extractAltText(node);
    }

    return Object.keys(config).length > 0 ? config : undefined;
  }

  private extractPositionConfig(node: FigmaNode): PositionConfig {
    const bounds = node.absoluteBoundingBox;
    return {
      x: bounds?.x || 0,
      y: bounds?.y || 0,
      width: bounds?.width || 0,
      height: bounds?.height || 0
    };
  }

  private extractConstraintConfig(node: FigmaNode): ConstraintConfig | undefined {
    if (!node.constraints) return undefined;

    return {
      horizontal: this.mapHorizontalConstraint(node.constraints.horizontal),
      vertical: this.mapVerticalConstraint(node.constraints.vertical)
    };
  }

  private mapHorizontalConstraint(constraint: string): 'left' | 'right' | 'center' | 'left-right' | 'scale' {
    switch (constraint) {
      case 'LEFT': return 'left';
      case 'RIGHT': return 'right';
      case 'CENTER': return 'center';
      case 'LEFT_RIGHT': return 'left-right';
      case 'SCALE': return 'scale';
      default: return 'left';
    }
  }

  private mapVerticalConstraint(constraint: string): 'top' | 'bottom' | 'center' | 'top-bottom' | 'scale' {
    switch (constraint) {
      case 'TOP': return 'top';
      case 'BOTTOM': return 'bottom';
      case 'CENTER': return 'center';
      case 'TOP_BOTTOM': return 'top-bottom';
      case 'SCALE': return 'scale';
      default: return 'top';
    }
  }

  private extractDescription(node: FigmaNode): string | undefined {
    // Extract description from node name or other properties
    return undefined;
  }

  private extractAltText(node: FigmaNode): string {
    return node.name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  }

  private sanitizeComponentName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private sanitizeElementName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .toLowerCase();
  }

  private colorToHex(color: Color): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private generateColorPalette(baseColor: string): any {
    // Generate color palette variations
    return {
      50: this.lightenColor(baseColor, 0.95),
      100: this.lightenColor(baseColor, 0.9),
      200: this.lightenColor(baseColor, 0.8),
      300: this.lightenColor(baseColor, 0.6),
      400: this.lightenColor(baseColor, 0.4),
      500: baseColor,
      600: this.darkenColor(baseColor, 0.2),
      700: this.darkenColor(baseColor, 0.4),
      800: this.darkenColor(baseColor, 0.6),
      900: this.darkenColor(baseColor, 0.8)
    };
  }

  private lightenColor(color: string, factor: number): string {
    // Simple color lightening
    return color; // Simplified implementation
  }

  private darkenColor(color: string, factor: number): string {
    // Simple color darkening
    return color; // Simplified implementation
  }

  private generateFontSizes(sizes: number[]): Record<string, string> {
    const sorted = sizes.sort((a, b) => a - b);
    return {
      xs: `${sorted[0] || 12}px`,
      sm: `${sorted[1] || 14}px`,
      base: `${sorted[2] || 16}px`,
      lg: `${sorted[3] || 18}px`,
      xl: `${sorted[4] || 20}px`,
      '2xl': `${sorted[5] || 24}px`,
      '3xl': `${sorted[6] || 30}px`,
      '4xl': `${sorted[7] || 36}px`
    };
  }

  private generateFontWeights(weights: number[]): Record<string, number> {
    const unique = [...new Set(weights)].sort((a, b) => a - b);
    return {
      light: unique[0] || 300,
      normal: unique[1] || 400,
      medium: unique[2] || 500,
      semibold: unique[3] || 600,
      bold: unique[4] || 700,
      extrabold: unique[5] || 800
    };
  }

  private generateLineHeights(heights: number[]): Record<string, number> {
    const sorted = heights.sort((a, b) => a - b);
    return {
      tight: sorted[0] || 1.2,
      normal: sorted[1] || 1.5,
      relaxed: sorted[2] || 1.8
    };
  }

  private generateLetterSpacings(spacings: number[]): Record<string, string> {
    return {
      tight: `-0.05em`,
      normal: '0',
      wide: '0.05em'
    };
  }

  private generateSpacingScale(spacings: number[]): Record<string, string> {
    const sorted = spacings.sort((a, b) => a - b);
    const scale: Record<string, string> = {};
    
    sorted.forEach((spacing, index) => {
      scale[`${index + 1}`] = `${spacing}px`;
    });

    return scale;
  }

  private generateElevationScale(shadows: string[]): Record<string, string> {
    return shadows.reduce((acc, shadow, index) => {
      acc[`${index + 1}`] = shadow;
      return acc;
    }, {} as Record<string, string>);
  }

  private generateBorderWidths(widths: number[]): Record<string, string> {
    return {
      thin: '1px',
      medium: '2px',
      thick: '4px'
    };
  }

  private generateBorderRadii(radii: number[]): Record<string, string> {
    const sorted = radii.sort((a, b) => a - b);
    return {
      none: '0',
      sm: `${sorted[0] || 4}px`,
      md: `${sorted[1] || 8}px`,
      lg: `${sorted[2] || 12}px`,
      xl: `${sorted[3] || 16}px`,
      full: '50%'
    };
  }

  private effectToBoxShadow(effect: any): string | null {
    if (!effect.color || !effect.offset) return null;
    
    const { r, g, b, a } = effect.color;
    const color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    const x = effect.offset.x || 0;
    const y = effect.offset.y || 0;
    const blur = effect.radius || 0;
    const spread = effect.spread || 0;
    
    return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }

  private traverseNodes(node: FigmaNode, callback: (node: FigmaNode) => void): void {
    callback(node);
    if (node.children) {
      node.children.forEach(child => this.traverseNodes(child, callback));
    }
  }
}