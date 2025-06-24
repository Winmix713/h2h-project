import { 
  ParsedComponent, 
  ParsedElement,
  GeneratorConfig, 
  GeneratedStylesheet,
  ParsedStyleSystem,
  ComputedStyles
} from '../types/generator';
import { StyleGeneratorInterface } from './core-generator';

export class InlineStylesGenerator implements StyleGeneratorInterface {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  async generateStyles(component: ParsedComponent, styleSystem: ParsedStyleSystem): Promise<GeneratedStylesheet | null> {
    // Inline styles don't generate separate style files
    return null;
  }

  generateImports(component: ParsedComponent): string | null {
    // No imports needed for inline styles
    return null;
  }

  generateClassName(component: ParsedComponent): string | null {
    if (!component.styles) return null;
    
    const styleObject = this.convertStylesToReactObject(component.styles);
    return styleObject ? `{${styleObject}}` : null;
  }

  generateElementClassName(element: ParsedElement): string | null {
    if (!element.styles || !this.hasSignificantStyles(element.styles)) {
      return null;
    }
    
    const styleObject = this.convertStylesToReactObject(element.styles);
    return styleObject ? `{${styleObject}}` : null;
  }

  async generateThemeStyles(styleSystem: ParsedStyleSystem): Promise<GeneratedStylesheet[]> {
    const styles: GeneratedStylesheet[] = [];

    // Generate theme object
    const themeContent = this.generateThemeObject(styleSystem);
    styles.push({
      name: 'theme',
      path: `${this.config.outputDir}/theme/theme.${this.config.useTypeScript ? 'ts' : 'js'}`,
      content: themeContent,
      type: 'styled',
      variables: {},
      mixins: []
    });

    return styles;
  }

  private convertStylesToReactObject(styles: ComputedStyles, variableName?: string): string | null {
    const styleProperties: string[] = [];

    // Layout styles
    if (styles.layout) {
      Object.entries(styles.layout).forEach(([prop, value]) => {
        if (value) {
          const reactProp = this.cssPropertyToReactProperty(prop);
          styleProperties.push(`${reactProp}: '${value}'`);
        }
      });
    }

    // Typography styles
    if (styles.typography) {
      Object.entries(styles.typography).forEach(([prop, value]) => {
        if (value !== undefined) {
          const reactProp = this.cssPropertyToReactProperty(prop);
          if (typeof value === 'number') {
            styleProperties.push(`${reactProp}: ${value}`);
          } else {
            styleProperties.push(`${reactProp}: '${value}'`);
          }
        }
      });
    }

    // Color styles
    if (styles.colors) {
      Object.entries(styles.colors).forEach(([prop, value]) => {
        if (value !== undefined) {
          const reactProp = this.cssPropertyToReactProperty(prop);
          if (typeof value === 'number') {
            styleProperties.push(`${reactProp}: ${value}`);
          } else {
            styleProperties.push(`${reactProp}: '${value}'`);
          }
        }
      });
    }

    // Spacing styles
    if (styles.spacing) {
      Object.entries(styles.spacing).forEach(([prop, value]) => {
        if (value) {
          const reactProp = this.cssPropertyToReactProperty(prop);
          styleProperties.push(`${reactProp}: '${value}'`);
        }
      });
    }

    // Border styles
    if (styles.borders) {
      Object.entries(styles.borders).forEach(([prop, value]) => {
        if (value) {
          const reactProp = this.cssPropertyToReactProperty(prop);
          styleProperties.push(`${reactProp}: '${value}'`);
        }
      });
    }

    // Shadow styles
    if (styles.shadows) {
      Object.entries(styles.shadows).forEach(([prop, value]) => {
        if (value) {
          const reactProp = this.cssPropertyToReactProperty(prop);
          styleProperties.push(`${reactProp}: '${value}'`);
        }
      });
    }

    // Effect styles
    if (styles.effects) {
      Object.entries(styles.effects).forEach(([prop, value]) => {
        if (value) {
          const reactProp = this.cssPropertyToReactProperty(prop);
          styleProperties.push(`${reactProp}: '${value}'`);
        }
      });
    }

    if (styleProperties.length === 0) return null;

    if (variableName) {
      return `const ${variableName} = {\n  ${styleProperties.join(',\n  ')}\n};`;
    } else {
      return `{\n  ${styleProperties.join(',\n  ')}\n}`;
    }
  }

  /**
   * Generate style object as a variable for reuse
   */
  generateStyleVariable(styles: ComputedStyles, variableName: string): string {
    const styleObject = this.convertStylesToReactObject(styles, variableName);
    return styleObject || `const ${variableName} = {};`;
  }

  /**
   * Generate dynamic style object with props
   */
  generateDynamicStyles(component: ParsedComponent): string {
    const dynamicStyles: string[] = [];

    // Base styles
    if (component.styles) {
      const baseStyles = this.convertStylesToReactObject(component.styles);
      if (baseStyles) {
        dynamicStyles.push(`const baseStyles = ${baseStyles};`);
      }
    }

    // Variant styles
    const variantStyles = this.generateVariantStyles(component);
    if (variantStyles) {
      dynamicStyles.push(variantStyles);
    }

    // Size styles
    const sizeStyles = this.generateSizeStyles(component);
    if (sizeStyles) {
      dynamicStyles.push(sizeStyles);
    }

    // State styles
    const stateStyles = this.generateStateStyles(component);
    if (stateStyles) {
      dynamicStyles.push(stateStyles);
    }

    // Merge styles function
    if (dynamicStyles.length > 0) {
      dynamicStyles.push(this.generateStyleMerger(component));
    }

    return dynamicStyles.join('\n\n');
  }

  private generateVariantStyles(component: ParsedComponent): string | null {
    const variantProp = component.props.find(p => p.name === 'variant');
    if (!variantProp || !variantProp.options) return null;

    const variants = variantProp.options.map(option => {
      const variantStyles = this.getVariantStyles(option.value);
      return `  ${option.value}: ${variantStyles}`;
    }).join(',\n');

    return `const variantStyles = {\n${variants}\n};`;
  }

  private generateSizeStyles(component: ParsedComponent): string | null {
    const sizeProp = component.props.find(p => p.name === 'size');
    if (!sizeProp || !sizeProp.options) return null;

    const sizes = sizeProp.options.map(option => {
      const sizeStyles = this.getSizeStyles(option.value);
      return `  ${option.value}: ${sizeStyles}`;
    }).join(',\n');

    return `const sizeStyles = {\n${sizes}\n};`;
  }

  private generateStateStyles(component: ParsedComponent): string | null {
    const states = ['hover', 'focus', 'active', 'disabled'];
    const stateStyles = states.map(state => {
      const styles = this.getStateStyles(component, state);
      return `  ${state}: ${styles}`;
    }).filter(style => !style.includes('{}'));

    if (stateStyles.length === 0) return null;

    return `const stateStyles = {\n${stateStyles.join(',\n')}\n};`;
  }

  private generateStyleMerger(component: ParsedComponent): string {
    const mergeConditions: string[] = ['baseStyles'];

    if (component.props.find(p => p.name === 'variant')) {
      mergeConditions.push('variant && variantStyles[variant]');
    }

    if (component.props.find(p => p.name === 'size')) {
      mergeConditions.push('size && sizeStyles[size]');
    }

    // Add conditional state styles
    mergeConditions.push('disabled && stateStyles.disabled');

    return `const styles = {
  ...${mergeConditions.join(',\n  ...')},
  ...style // Allow style prop override
};`;
  }

  private generateThemeObject(styleSystem: ParsedStyleSystem): string {
    const theme = {
      colors: this.generateThemeColors(styleSystem.colors),
      typography: this.generateThemeTypography(styleSystem.typography),
      spacing: this.generateThemeSpacing(styleSystem.spacing),
      shadows: this.generateThemeShadows(styleSystem.shadows),
      borders: this.generateThemeBorders(styleSystem.borders)
    };

    const themeString = JSON.stringify(theme, null, 2);
    
    if (this.config.useTypeScript) {
      return `export const theme = ${themeString} as const;

export type Theme = typeof theme;`;
    } else {
      return `export const theme = ${themeString};`;
    }
  }

  private generateThemeColors(colors: any): any {
    const themeColors: any = {};
    
    Object.entries(colors).forEach(([key, palette]: [string, any]) => {
      if (typeof palette === 'object' && palette !== null) {
        themeColors[key] = palette;
      } else {
        themeColors[key] = palette;
      }
    });

    return themeColors;
  }

  private generateThemeTypography(typography: any): any {
    return {
      fontFamilies: typography.fontFamilies || {},
      fontSizes: typography.fontSizes || {},
      fontWeights: typography.fontWeights || {},
      lineHeights: typography.lineHeights || {},
      letterSpacings: typography.letterSpacings || {}
    };
  }

  private generateThemeSpacing(spacing: any): any {
    return spacing.scale || {};
  }

  private generateThemeShadows(shadows: any): any {
    return shadows.elevation || {};
  }

  private generateThemeBorders(borders: any): any {
    return {
      widths: borders.widths || {},
      styles: borders.styles || {},
      radii: borders.radii || {}
    };
  }

  private getVariantStyles(variant: string): string {
    // Generate variant-specific styles
    switch (variant) {
      case 'primary':
        return `{
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    color: '#FFFFFF'
  }`;
      case 'secondary':
        return `{
    backgroundColor: '#6B7280',
    borderColor: '#6B7280',
    color: '#FFFFFF'
  }`;
      case 'outline':
        return `{
    backgroundColor: 'transparent',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#3B82F6',
    color: '#3B82F6'
  }`;
      default:
        return '{}';
    }
  }

  private getSizeStyles(size: string): string {
    // Generate size-specific styles
    switch (size) {
      case 'small':
        return `{
    padding: '4px 8px',
    fontSize: '14px'
  }`;
      case 'medium':
        return `{
    padding: '8px 16px',
    fontSize: '16px'
  }`;
      case 'large':
        return `{
    padding: '12px 24px',
    fontSize: '18px'
  }`;
      default:
        return '{}';
    }
  }

  private getStateStyles(component: ParsedComponent, state: string): string {
    // Generate state-specific styles
    switch (state) {
      case 'hover':
        if (component.category === 'button') {
          return `{
    opacity: 0.9,
    transform: 'translateY(-1px)'
  }`;
        }
        return '{}';
      case 'focus':
        return `{
    outline: '2px solid #3B82F6',
    outlineOffset: '2px'
  }`;
      case 'active':
        if (component.category === 'button') {
          return `{
    transform: 'translateY(0)'
  }`;
        }
        return '{}';
      case 'disabled':
        return `{
    opacity: 0.6,
    cursor: 'not-allowed',
    pointerEvents: 'none'
  }`;
      default:
        return '{}';
    }
  }

  private cssPropertyToReactProperty(cssProperty: string): string {
    // Convert CSS properties to React camelCase style properties
    return cssProperty.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  private hasSignificantStyles(styles: ComputedStyles): boolean {
    const hasLayout = styles.layout && Object.values(styles.layout).some(v => v);
    const hasColors = styles.colors && Object.values(styles.colors).some(v => v);
    const hasSpacing = styles.spacing && Object.values(styles.spacing).some(v => v);
    const hasBorders = styles.borders && Object.values(styles.borders).some(v => v);
    const hasShadows = styles.shadows && Object.values(styles.shadows).some(v => v);
    
    return hasLayout || hasColors || hasSpacing || hasBorders || hasShadows;
  }
}