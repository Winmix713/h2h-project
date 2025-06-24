import { 
  ParsedComponent, 
  ParsedElement,
  GeneratorConfig, 
  GeneratedStylesheet,
  ParsedStyleSystem,
  ComputedStyles
} from '../types/generator';
import { StyleGeneratorInterface } from './core-generator';

export class StyledComponentsGenerator implements StyleGeneratorInterface {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  /**
   * Generate styled-components styles for a component
   */
  async generateStyles(component: ParsedComponent, styleSystem: ParsedStyleSystem): Promise<GeneratedStylesheet | null> {
    const componentName = this.getStyledComponentName(component);
    const styles = this.generateStyledComponent(component, componentName);
    
    if (!styles) return null;

    const content = this.generateStyledComponentsFile(component, styles, styleSystem);
    
    return {
      name: `${component.name}.styles`,
      path: `${this.config.outputDir}/${component.category}/${component.name}.styles.ts`,
      content,
      type: 'styled',
      variables: this.extractThemeVariables(styleSystem),
      mixins: []
    };
  }

  /**
   * Generate import statements for styled-components
   */
  generateImports(component: ParsedComponent): string | null {
    const styledComponentName = this.getStyledComponentName(component);
    return `import { ${styledComponentName} } from './${component.name}.styles';`;
  }

  /**
   * Generate className prop for styled-components
   */
  generateClassName(component: ParsedComponent): string | null {
    // Styled components don't use className directly
    return null;
  }

  /**
   * Generate className for child elements
   */
  generateElementClassName(element: ParsedElement): string | null {
    if (element.styles && this.hasSignificantStyles(element.styles)) {
      return `"${element.name}-element"`;
    }
    return null;
  }

  /**
   * Generate theme and global styles
   */
  async generateThemeStyles(styleSystem: ParsedStyleSystem): Promise<GeneratedStylesheet[]> {
    const styles: GeneratedStylesheet[] = [];

    // Generate theme file
    const themeContent = this.generateThemeFile(styleSystem);
    styles.push({
      name: 'theme',
      path: `${this.config.outputDir}/theme/theme.ts`,
      content: themeContent,
      type: 'styled',
      variables: this.extractThemeVariables(styleSystem),
      mixins: []
    });

    // Generate global styles
    const globalContent = this.generateGlobalStyles(styleSystem);
    styles.push({
      name: 'global',
      path: `${this.config.outputDir}/theme/global.ts`,
      content: globalContent,
      type: 'styled',
      variables: {},
      mixins: []
    });

    return styles;
  }

  /**
   * Generate complete styled-components file
   */
  private generateStyledComponentsFile(
    component: ParsedComponent, 
    mainStyles: string,
    styleSystem: ParsedStyleSystem
  ): string {
    const imports = this.generateFileImports(component);
    const childStyles = this.generateChildElementStyles(component.children);
    const props = this.generatePropsInterface(component);
    
    return `${imports}

${props}

${mainStyles}

${childStyles}`.trim();
  }

  /**
   * Generate styled component
   */
  private generateStyledComponent(component: ParsedComponent, componentName: string): string | null {
    if (!component.styles || !this.hasSignificantStyles(component.styles)) {
      return null;
    }

    const baseElement = this.getBaseElement(component);
    const styles = this.convertStylesToCSS(component.styles);
    const propsHandling = this.generatePropsHandling(component);
    const responsive = this.generateResponsiveStyles(component.styles.responsive);

    return `export const ${componentName} = styled.${baseElement}<${component.name}StyleProps>\`
  ${styles}
  ${propsHandling}
  ${responsive}
\`;`;
  }

  /**
   * Generate styled components for child elements
   */
  private generateChildElementStyles(children: ParsedElement[]): string {
    const childStyles: string[] = [];

    children.forEach(child => {
      if (child.styles && this.hasSignificantStyles(child.styles)) {
        const childName = this.pascalCase(child.name);
        const styles = this.convertStylesToCSS(child.styles);
        const baseElement = child.tagName.toLowerCase();

        childStyles.push(`export const ${childName}Element = styled.${baseElement}\`
  ${styles}
\`;`);
      }

      // Recursively handle nested children
      if (child.children.length > 0) {
        childStyles.push(this.generateChildElementStyles(child.children));
      }
    });

    return childStyles.join('\n\n');
  }

  /**
   * Generate file imports
   */
  private generateFileImports(component: ParsedComponent): string {
    const imports = [
      "import styled, { css } from 'styled-components';",
      "import { theme } from '../theme/theme';"
    ];

    // Add responsive utilities if needed
    if (this.needsResponsiveUtils(component)) {
      imports.push("import { media } from '../theme/media';");
    }

    return imports.join('\n');
  }

  /**
   * Generate props interface for styled component
   */
  private generatePropsInterface(component: ParsedComponent): string {
    if (!this.config.useTypeScript) return '';

    const props = component.props.map(prop => {
      const optional = prop.required ? '' : '?';
      return `  ${prop.name}${optional}: ${this.mapPropType(prop.type)};`;
    }).join('\n');

    return `interface ${component.name}StyleProps {
${props}
}`;
  }

  /**
   * Generate props handling within styled component
   */
  private generatePropsHandling(component: ParsedComponent): string {
    const propHandlers: string[] = [];

    component.props.forEach(prop => {
      switch (prop.name) {
        case 'variant':
          propHandlers.push(this.generateVariantHandler(component, prop));
          break;
        case 'size':
          propHandlers.push(this.generateSizeHandler(prop));
          break;
        case 'disabled':
          propHandlers.push(this.generateDisabledHandler());
          break;
        case 'fullWidth':
          propHandlers.push(this.generateFullWidthHandler());
          break;
      }
    });

    return propHandlers.join('\n  ');
  }

  /**
   * Generate variant handler
   */
  private generateVariantHandler(component: ParsedComponent, prop: any): string {
    if (!prop.options || prop.options.length === 0) return '';

    const variants = prop.options.map((option: any) => {
      return `    ${option.value}: css\`
      // Variant styles for ${option.value}
      background-color: \${theme.colors.${option.value}.main};
      border-color: \${theme.colors.${option.value}.main};
      color: \${theme.colors.${option.value}.contrast};
    \`,`;
    }).join('\n');

    return `\${props => props.variant && css\`
    \${({
${variants}
    })[props.variant]}
  \`}`;
  }

  /**
   * Generate size handler
   */
  private generateSizeHandler(prop: any): string {
    return `\${props => props.size && css\`
    \${props.size === 'small' && css\`
      padding: \${theme.spacing.xs} \${theme.spacing.sm};
      font-size: \${theme.typography.fontSizes.sm};
    \`}
    \${props.size === 'medium' && css\`
      padding: \${theme.spacing.sm} \${theme.spacing.md};
      font-size: \${theme.typography.fontSizes.base};
    \`}
    \${props.size === 'large' && css\`
      padding: \${theme.spacing.md} \${theme.spacing.lg};
      font-size: \${theme.typography.fontSizes.lg};
    \`}
  \`}`;
  }

  /**
   * Generate disabled handler
   */
  private generateDisabledHandler(): string {
    return `\${props => props.disabled && css\`
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  \`}`;
  }

  /**
   * Generate full width handler
   */
  private generateFullWidthHandler(): string {
    return `\${props => props.fullWidth && css\`
    width: 100%;
  \`}`;
  }

  /**
   * Generate responsive styles
   */
  private generateResponsiveStyles(responsive: any): string {
    if (!responsive) return '';

    const breakpoints = Object.keys(responsive);
    const responsiveCSS = breakpoints.map(breakpoint => {
      const styles = this.convertStylesToCSS(responsive[breakpoint]);
      return `\${media.${breakpoint}\`
    ${styles}
  \`}`;
    }).join('\n  ');

    return responsiveCSS;
  }

  /**
   * Generate theme file
   */
  private generateThemeFile(styleSystem: ParsedStyleSystem): string {
    const colors = this.generateThemeColors(styleSystem.colors);
    const typography = this.generateThemeTypography(styleSystem.typography);
    const spacing = this.generateThemeSpacing(styleSystem.spacing);
    const shadows = this.generateThemeShadows(styleSystem.shadows);
    const borders = this.generateThemeBorders(styleSystem.borders);

    return `export const theme = {
  colors: {
${colors}
  },
  typography: {
${typography}
  },
  spacing: {
${spacing}
  },
  shadows: {
${shadows}
  },
  borders: {
${borders}
  }
};

export type Theme = typeof theme;`;
  }

  /**
   * Generate global styles
   */
  private generateGlobalStyles(styleSystem: ParsedStyleSystem): string {
    return `import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyle = createGlobalStyle\`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    line-height: 1.5;
  }

  body {
    font-family: \${theme.typography.fontFamilies.sans};
    color: \${theme.colors.neutral[900]};
    background-color: \${theme.colors.neutral[50]};
  }

  button {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    border: none;
    background: none;
    cursor: pointer;
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  a {
    color: \${theme.colors.primary[600]};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
\`;`;
  }

  /**
   * Convert computed styles to CSS string
   */
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

  // Helper methods

  private getStyledComponentName(component: ParsedComponent): string {
    return `Styled${component.name}`;
  }

  private getBaseElement(component: ParsedComponent): string {
    switch (component.category) {
      case 'button': return 'button';
      case 'input': return 'input';
      case 'textarea': return 'textarea';
      case 'form': return 'form';
      case 'header': return 'header';
      case 'footer': return 'footer';
      case 'navigation': return 'nav';
      case 'list': return 'ul';
      case 'image': return 'img';
      case 'link': return 'a';
      default: return 'div';
    }
  }

  private hasSignificantStyles(styles: ComputedStyles): boolean {
    const hasLayout = styles.layout && Object.values(styles.layout).some(v => v);
    const hasColors = styles.colors && Object.values(styles.colors).some(v => v);
    const hasSpacing = styles.spacing && Object.values(styles.spacing).some(v => v);
    const hasBorders = styles.borders && Object.values(styles.borders).some(v => v);
    const hasShadows = styles.shadows && Object.values(styles.shadows).some(v => v);
    
    return hasLayout || hasColors || hasSpacing || hasBorders || hasShadows;
  }

  private needsResponsiveUtils(component: ParsedComponent): boolean {
    return component.styles?.responsive !== undefined;
  }

  private mapPropType(type: string): string {
    switch (type) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'variant': return 'string';
      case 'size': return '"small" | "medium" | "large"';
      default: return 'any';
    }
  }

  private generateThemeColors(colors: any): string {
    const colorEntries = Object.entries(colors).map(([key, palette]: [string, any]) => {
      if (typeof palette === 'object' && palette !== null) {
        const paletteEntries = Object.entries(palette).map(([shade, color]) => {
          return `      ${shade}: '${color}',`;
        }).join('\n');
        return `    ${key}: {
${paletteEntries}
    },`;
      } else {
        return `    ${key}: '${palette}',`;
      }
    }).join('\n');

    return colorEntries;
  }

  private generateThemeTypography(typography: any): string {
    const entries = Object.entries(typography).map(([key, value]: [string, any]) => {
      if (typeof value === 'object' && value !== null) {
        const subEntries = Object.entries(value).map(([subKey, subValue]) => {
          return `      ${subKey}: '${subValue}',`;
        }).join('\n');
        return `    ${key}: {
${subEntries}
    },`;
      } else {
        return `    ${key}: '${value}',`;
      }
    }).join('\n');

    return entries;
  }

  private generateThemeSpacing(spacing: any): string {
    const entries = Object.entries(spacing.scale || spacing).map(([key, value]) => {
      return `    ${key}: '${value}',`;
    }).join('\n');

    return entries;
  }

  private generateThemeShadows(shadows: any): string {
    const entries = Object.entries(shadows.elevation || shadows).map(([key, value]) => {
      return `    ${key}: '${value}',`;
    }).join('\n');

    return entries;
  }

  private generateThemeBorders(borders: any): string {
    const entries = Object.entries(borders).map(([category, values]: [string, any]) => {
      const subEntries = Object.entries(values).map(([key, value]) => {
        return `      ${key}: '${value}',`;
      }).join('\n');
      return `    ${category}: {
${subEntries}
    },`;
    }).join('\n');

    return entries;
  }

  private extractThemeVariables(styleSystem: ParsedStyleSystem): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Extract color variables
    Object.entries(styleSystem.colors).forEach(([key, palette]: [string, any]) => {
      if (typeof palette === 'object') {
        Object.entries(palette).forEach(([shade, color]) => {
          variables[`${key}-${shade}`] = color as string;
        });
      } else {
        variables[key] = palette as string;
      }
    });

    return variables;
  }

  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }
}