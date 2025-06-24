import { 
  ParsedComponent, 
  ParsedElement,
  GeneratorConfig, 
  GeneratedStylesheet,
  ParsedStyleSystem,
  ComputedStyles
} from '../types/generator';
import { StyleGeneratorInterface } from './core-generator';

export class CSSModulesGenerator implements StyleGeneratorInterface {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  async generateStyles(component: ParsedComponent, styleSystem: ParsedStyleSystem): Promise<GeneratedStylesheet | null> {
    const styles = this.generateCSSModuleStyles(component);
    
    if (!styles) return null;

    return {
      name: `${component.name}.module`,
      path: `${this.config.outputDir}/${component.category}/${component.name}.module.css`,
      content: styles,
      type: 'css',
      variables: this.extractCSSVariables(styleSystem),
      mixins: []
    };
  }

  generateImports(component: ParsedComponent): string | null {
    return `import styles from './${component.name}.module.css';`;
  }

  generateClassName(component: ParsedComponent): string | null {
    return `styles.${this.getComponentClassName(component)}`;
  }

  generateElementClassName(element: ParsedElement): string | null {
    if (element.styles && this.hasSignificantStyles(element.styles)) {
      return `styles.${this.getElementClassName(element)}`;
    }
    return null;
  }

  async generateThemeStyles(styleSystem: ParsedStyleSystem): Promise<GeneratedStylesheet[]> {
    const styles: GeneratedStylesheet[] = [];

    // Generate CSS custom properties
    const variablesContent = this.generateCSSVariables(styleSystem);
    styles.push({
      name: 'variables',
      path: `${this.config.outputDir}/theme/variables.css`,
      content: variablesContent,
      type: 'css',
      variables: this.extractCSSVariables(styleSystem),
      mixins: []
    });

    // Generate utility classes
    const utilityContent = this.generateUtilityClasses(styleSystem);
    styles.push({
      name: 'utilities',
      path: `${this.config.outputDir}/theme/utilities.css`,
      content: utilityContent,
      type: 'css',
      variables: {},
      mixins: []
    });

    return styles;
  }

  private generateCSSModuleStyles(component: ParsedComponent): string | null {
    if (!component.styles || !this.hasSignificantStyles(component.styles)) {
      return null;
    }

    const styles: string[] = [];
    
    // Component root styles
    const rootClass = this.getComponentClassName(component);
    const rootStyles = this.convertStylesToCSS(component.styles);
    styles.push(`.${rootClass} {
${rootStyles}
}`);

    // Element styles
    const elementStyles = this.generateElementStyles(component.children);
    styles.push(...elementStyles);

    // Modifier classes
    const modifierStyles = this.generateModifierStyles(component);
    styles.push(...modifierStyles);

    return styles.join('\n\n');
  }

  private generateElementStyles(elements: ParsedElement[]): string[] {
    const styles: string[] = [];

    elements.forEach(element => {
      if (element.styles && this.hasSignificantStyles(element.styles)) {
        const className = this.getElementClassName(element);
        const elementCSS = this.convertStylesToCSS(element.styles);
        
        styles.push(`.${className} {
${elementCSS}
}`);
      }

      // Recursively handle child elements
      if (element.children.length > 0) {
        styles.push(...this.generateElementStyles(element.children));
      }
    });

    return styles;
  }

  private generateModifierStyles(component: ParsedComponent): string[] {
    const styles: string[] = [];
    const baseClass = this.getComponentClassName(component);

    // Generate variant modifiers
    component.props.forEach(prop => {
      if (prop.name === 'variant' && prop.options) {
        prop.options.forEach(option => {
          const modifierClass = `${baseClass}--${this.kebabCase(option.value)}`;
          const variantStyles = this.generateVariantStyles(option.value);
          
          styles.push(`.${modifierClass} {
${variantStyles}
}`);
        });
      }

      if (prop.name === 'size' && prop.options) {
        prop.options.forEach(option => {
          const modifierClass = `${baseClass}--${this.kebabCase(option.value)}`;
          const sizeStyles = this.generateSizeStyles(option.value);
          
          styles.push(`.${modifierClass} {
${sizeStyles}
}`);
        });
      }
    });

    // State modifiers
    const stateModifiers = ['hover', 'focus', 'active', 'disabled'];
    stateModifiers.forEach(state => {
      const stateStyles = this.generateStateStyles(component, state);
      if (stateStyles) {
        styles.push(`.${baseClass}:${state} {
${stateStyles}
}`);
      }
    });

    return styles;
  }

  private generateCSSVariables(styleSystem: ParsedStyleSystem): string {
    const variables: string[] = [':root {'];

    // Color variables
    Object.entries(styleSystem.colors).forEach(([key, palette]: [string, any]) => {
      if (typeof palette === 'object' && palette !== null) {
        Object.entries(palette).forEach(([shade, color]) => {
          variables.push(`  --color-${key}-${shade}: ${color};`);
        });
      } else {
        variables.push(`  --color-${key}: ${palette};`);
      }
    });

    // Typography variables
    Object.entries(styleSystem.typography.fontSizes || {}).forEach(([key, size]) => {
      variables.push(`  --font-size-${key}: ${size};`);
    });

    Object.entries(styleSystem.typography.fontWeights || {}).forEach(([key, weight]) => {
      variables.push(`  --font-weight-${key}: ${weight};`);
    });

    Object.entries(styleSystem.typography.fontFamilies || {}).forEach(([key, family]) => {
      variables.push(`  --font-family-${key}: ${family};`);
    });

    // Spacing variables
    Object.entries(styleSystem.spacing.scale || {}).forEach(([key, value]) => {
      variables.push(`  --spacing-${key}: ${value};`);
    });

    // Shadow variables
    Object.entries(styleSystem.shadows.elevation || {}).forEach(([key, shadow]) => {
      variables.push(`  --shadow-${key}: ${shadow};`);
    });

    // Border variables
    Object.entries(styleSystem.borders.radii || {}).forEach(([key, radius]) => {
      variables.push(`  --border-radius-${key}: ${radius};`);
    });

    variables.push('}');
    return variables.join('\n');
  }

  private generateUtilityClasses(styleSystem: ParsedStyleSystem): string {
    const utilities: string[] = [];

    // Spacing utilities
    Object.entries(styleSystem.spacing.scale || {}).forEach(([key, value]) => {
      utilities.push(`.m-${key} { margin: var(--spacing-${key}); }`);
      utilities.push(`.p-${key} { padding: var(--spacing-${key}); }`);
      utilities.push(`.mt-${key} { margin-top: var(--spacing-${key}); }`);
      utilities.push(`.mb-${key} { margin-bottom: var(--spacing-${key}); }`);
      utilities.push(`.ml-${key} { margin-left: var(--spacing-${key}); }`);
      utilities.push(`.mr-${key} { margin-right: var(--spacing-${key}); }`);
      utilities.push(`.pt-${key} { padding-top: var(--spacing-${key}); }`);
      utilities.push(`.pb-${key} { padding-bottom: var(--spacing-${key}); }`);
      utilities.push(`.pl-${key} { padding-left: var(--spacing-${key}); }`);
      utilities.push(`.pr-${key} { padding-right: var(--spacing-${key}); }`);
    });

    // Color utilities
    Object.entries(styleSystem.colors).forEach(([colorKey, palette]: [string, any]) => {
      if (typeof palette === 'object' && palette !== null) {
        Object.keys(palette).forEach(shade => {
          utilities.push(`.text-${colorKey}-${shade} { color: var(--color-${colorKey}-${shade}); }`);
          utilities.push(`.bg-${colorKey}-${shade} { background-color: var(--color-${colorKey}-${shade}); }`);
          utilities.push(`.border-${colorKey}-${shade} { border-color: var(--color-${colorKey}-${shade}); }`);
        });
      }
    });

    // Typography utilities
    Object.keys(styleSystem.typography.fontSizes || {}).forEach(size => {
      utilities.push(`.text-${size} { font-size: var(--font-size-${size}); }`);
    });

    Object.keys(styleSystem.typography.fontWeights || {}).forEach(weight => {
      utilities.push(`.font-${weight} { font-weight: var(--font-weight-${weight}); }`);
    });

    // Border radius utilities
    Object.keys(styleSystem.borders.radii || {}).forEach(radius => {
      utilities.push(`.rounded-${radius} { border-radius: var(--border-radius-${radius}); }`);
    });

    // Shadow utilities
    Object.keys(styleSystem.shadows.elevation || {}).forEach(shadow => {
      utilities.push(`.shadow-${shadow} { box-shadow: var(--shadow-${shadow}); }`);
    });

    return utilities.join('\n');
  }

  private convertStylesToCSS(styles: ComputedStyles): string {
    const cssLines: string[] = [];

    // Layout styles
    if (styles.layout) {
      Object.entries(styles.layout).forEach(([prop, value]) => {
        if (value) {
          cssLines.push(`  ${this.kebabCase(prop)}: ${value};`);
        }
      });
    }

    // Typography styles
    if (styles.typography) {
      Object.entries(styles.typography).forEach(([prop, value]) => {
        if (value) {
          cssLines.push(`  ${this.kebabCase(prop)}: ${value};`);
        }
      });
    }

    // Color styles
    if (styles.colors) {
      Object.entries(styles.colors).forEach(([prop, value]) => {
        if (value) {
          cssLines.push(`  ${this.kebabCase(prop)}: ${value};`);
        }
      });
    }

    // Spacing styles
    if (styles.spacing) {
      Object.entries(styles.spacing).forEach(([prop, value]) => {
        if (value) {
          cssLines.push(`  ${this.kebabCase(prop)}: ${value};`);
        }
      });
    }

    // Border styles
    if (styles.borders) {
      Object.entries(styles.borders).forEach(([prop, value]) => {
        if (value) {
          cssLines.push(`  ${this.kebabCase(prop)}: ${value};`);
        }
      });
    }

    // Shadow styles
    if (styles.shadows) {
      Object.entries(styles.shadows).forEach(([prop, value]) => {
        if (value) {
          cssLines.push(`  ${this.kebabCase(prop)}: ${value};`);
        }
      });
    }

    // Effect styles
    if (styles.effects) {
      Object.entries(styles.effects).forEach(([prop, value]) => {
        if (value) {
          cssLines.push(`  ${this.kebabCase(prop)}: ${value};`);
        }
      });
    }

    return cssLines.join('\n');
  }

  private generateVariantStyles(variant: string): string {
    // Generate variant-specific styles
    switch (variant) {
      case 'primary':
        return `  background-color: var(--color-primary-500);
  border-color: var(--color-primary-500);
  color: white;`;
      case 'secondary':
        return `  background-color: var(--color-secondary-500);
  border-color: var(--color-secondary-500);
  color: white;`;
      case 'outline':
        return `  background-color: transparent;
  border: 1px solid var(--color-primary-500);
  color: var(--color-primary-500);`;
      default:
        return '';
    }
  }

  private generateSizeStyles(size: string): string {
    // Generate size-specific styles
    switch (size) {
      case 'small':
        return `  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-sm);`;
      case 'medium':
        return `  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-base);`;
      case 'large':
        return `  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-lg);`;
      default:
        return '';
    }
  }

  private generateStateStyles(component: ParsedComponent, state: string): string | null {
    // Generate state-specific styles
    switch (state) {
      case 'hover':
        if (component.category === 'button') {
          return `  opacity: 0.9;
  transform: translateY(-1px);`;
        }
        break;
      case 'focus':
        return `  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;`;
      case 'active':
        if (component.category === 'button') {
          return `  transform: translateY(0);`;
        }
        break;
      case 'disabled':
        return `  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;`;
    }
    return null;
  }

  // Helper methods

  private getComponentClassName(component: ParsedComponent): string {
    return this.camelCase(component.name);
  }

  private getElementClassName(element: ParsedElement): string {
    return this.camelCase(`${element.name}Element`);
  }

  private hasSignificantStyles(styles: ComputedStyles): boolean {
    const hasLayout = styles.layout && Object.values(styles.layout).some(v => v);
    const hasColors = styles.colors && Object.values(styles.colors).some(v => v);
    const hasSpacing = styles.spacing && Object.values(styles.spacing).some(v => v);
    const hasBorders = styles.borders && Object.values(styles.borders).some(v => v);
    const hasShadows = styles.shadows && Object.values(styles.shadows).some(v => v);
    
    return hasLayout || hasColors || hasSpacing || hasBorders || hasShadows;
  }

  private extractCSSVariables(styleSystem: ParsedStyleSystem): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Extract color variables
    Object.entries(styleSystem.colors).forEach(([key, palette]: [string, any]) => {
      if (typeof palette === 'object') {
        Object.entries(palette).forEach(([shade, color]) => {
          variables[`color-${key}-${shade}`] = color as string;
        });
      } else {
        variables[`color-${key}`] = palette as string;
      }
    });

    return variables;
  }

  private camelCase(str: string): string {
    return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }
}