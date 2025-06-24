import { ParsedComponent, GeneratorConfig, NamingConvention } from '../types/generator';

export class ComponentNamer {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  /**
   * Generate component name based on naming convention
   */
  generateComponentName(component: ParsedComponent): string {
    const baseName = this.sanitizeName(component.name);
    return this.applyNamingConvention(baseName, this.config.componentNaming);
  }

  /**
   * Generate file name based on naming convention
   */
  generateFileName(component: ParsedComponent): string {
    const baseName = this.sanitizeName(component.name);
    return this.applyNamingConvention(baseName, this.config.fileNaming);
  }

  /**
   * Generate prop name
   */
  generatePropName(propName: string): string {
    return this.toCamelCase(this.sanitizeName(propName));
  }

  /**
   * Generate variable name
   */
  generateVariableName(name: string): string {
    return this.toCamelCase(this.sanitizeName(name));
  }

  /**
   * Generate CSS class name
   */
  generateClassName(component: ParsedComponent, element?: string): string {
    const baseName = this.sanitizeName(component.name);
    const className = this.toKebabCase(baseName);
    
    if (element) {
      const elementName = this.toKebabCase(this.sanitizeName(element));
      return `${className}__${elementName}`;
    }
    
    return className;
  }

  /**
   * Generate CSS variable name
   */
  generateCSSVariableName(name: string): string {
    return `--${this.toKebabCase(this.sanitizeName(name))}`;
  }

  /**
   * Generate interface name
   */
  generateInterfaceName(baseName: string, suffix: string = ''): string {
    const name = this.sanitizeName(baseName);
    return this.toPascalCase(name) + suffix;
  }

  /**
   * Generate type name
   */
  generateTypeName(baseName: string, suffix: string = ''): string {
    const name = this.sanitizeName(baseName);
    return this.toPascalCase(name) + suffix;
  }

  /**
   * Generate enum name
   */
  generateEnumName(baseName: string): string {
    const name = this.sanitizeName(baseName);
    return this.toPascalCase(name);
  }

  /**
   * Generate constant name
   */
  generateConstantName(name: string): string {
    return this.toScreamingSnakeCase(this.sanitizeName(name));
  }

  /**
   * Generate function name
   */
  generateFunctionName(name: string): string {
    return this.toCamelCase(this.sanitizeName(name));
  }

  /**
   * Generate hook name
   */
  generateHookName(name: string): string {
    const baseName = this.toCamelCase(this.sanitizeName(name));
    return baseName.startsWith('use') ? baseName : `use${this.toPascalCase(baseName)}`;
  }

  /**
   * Generate story name for Storybook
   */
  generateStoryName(component: ParsedComponent, variant?: string): string {
    const baseName = this.sanitizeName(component.name);
    const storyName = this.toPascalCase(baseName);
    
    if (variant) {
      const variantName = this.toPascalCase(this.sanitizeName(variant));
      return `${storyName}${variantName}`;
    }
    
    return storyName;
  }

  /**
   * Generate test name
   */
  generateTestName(component: ParsedComponent, testCase?: string): string {
    const baseName = this.sanitizeName(component.name);
    const componentName = this.toPascalCase(baseName);
    
    if (testCase) {
      return `${componentName} ${testCase}`;
    }
    
    return componentName;
  }

  /**
   * Generate directory name
   */
  generateDirectoryName(name: string): string {
    return this.toKebabCase(this.sanitizeName(name));
  }

  // Private helper methods

  private sanitizeName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private applyNamingConvention(name: string, convention: NamingConvention): string {
    switch (convention) {
      case 'PascalCase':
        return this.toPascalCase(name);
      case 'camelCase':
        return this.toCamelCase(name);
      case 'kebab-case':
        return this.toKebabCase(name);
      case 'snake_case':
        return this.toSnakeCase(name);
      default:
        return this.toPascalCase(name);
    }
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^(.)/, (_, c) => c.toLowerCase());
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[\s\-]+/g, '_')
      .toLowerCase();
  }

  private toScreamingSnakeCase(str: string): string {
    return this.toSnakeCase(str).toUpperCase();
  }

  /**
   * Validate component name
   */
  validateComponentName(name: string): boolean {
    // React component names must start with uppercase letter
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  }

  /**
   * Validate file name
   */
  validateFileName(name: string): boolean {
    // File names should not contain invalid characters
    return !/[<>:"/\\|?*]/.test(name);
  }

  /**
   * Generate unique name if conflict exists
   */
  generateUniqueName(baseName: string, existingNames: string[], suffix: string = ''): string {
    let name = baseName + suffix;
    let counter = 1;
    
    while (existingNames.includes(name)) {
      name = `${baseName}${counter}${suffix}`;
      counter++;
    }
    
    return name;
  }

  /**
   * Extract component name from Figma node name
   */
  extractComponentNameFromFigma(figmaName: string): string {
    // Remove common prefixes/suffixes
    let name = figmaName
      .replace(/^(Component|Comp|UI|UX)\s*/i, '')
      .replace(/\s*(Component|Comp|UI|UX)$/i, '')
      .replace(/\s*[-/]\s*.*$/, '') // Remove variant info after dash or slash
      .replace(/\s*\(.*\)$/, '') // Remove parenthetical info
      .replace(/\s*\[.*\]$/, '') // Remove bracket info
      .replace(/\s*v\d+(\.\d+)*$/i, '') // Remove version numbers
      .replace(/\s*(default|hover|active|disabled|selected)$/i, '') // Remove state suffixes
      .replace(/\s*(primary|secondary|tertiary)$/i, '') // Remove variant suffixes
      .replace(/\s*(small|medium|large|xs|sm|md|lg|xl)$/i, ''); // Remove size suffixes

    return this.sanitizeName(name);
  }

  /**
   * Generate BEM class names
   */
  generateBEMClassName(block: string, element?: string, modifier?: string): string {
    let className = this.toKebabCase(this.sanitizeName(block));
    
    if (element) {
      className += `__${this.toKebabCase(this.sanitizeName(element))}`;
    }
    
    if (modifier) {
      className += `--${this.toKebabCase(this.sanitizeName(modifier))}`;
    }
    
    return className;
  }

  /**
   * Generate CSS module class name
   */
  generateCSSModuleClassName(component: ParsedComponent, element?: string, modifier?: string): string {
    const baseName = this.sanitizeName(component.name);
    let className = this.toCamelCase(baseName);
    
    if (element) {
      className += this.toPascalCase(this.sanitizeName(element));
    }
    
    if (modifier) {
      className += this.toPascalCase(this.sanitizeName(modifier));
    }
    
    return className;
  }

  /**
   * Generate Tailwind utility class combinations
   */
  generateTailwindClasses(baseClasses: string[], modifiers?: Record<string, string>): string {
    let classes = baseClasses.join(' ');
    
    if (modifiers) {
      Object.entries(modifiers).forEach(([condition, additionalClasses]) => {
        if (additionalClasses) {
          classes += ` ${condition}:${additionalClasses}`;
        }
      });
    }
    
    return classes.trim();
  }

  /**
   * Check if name is reserved keyword
   */
  isReservedKeyword(name: string): boolean {
    const reservedKeywords = [
      // JavaScript reserved words
      'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
      'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
      'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
      'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
      'let', 'static', 'enum', 'implements', 'interface', 'package', 'private',
      'protected', 'public', 'await', 'async',
      
      // React reserved props
      'key', 'ref', 'children', 'dangerouslySetInnerHTML',
      
      // HTML element names
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img',
      'button', 'input', 'form', 'table', 'tr', 'td', 'th', 'ul', 'ol', 'li',
      
      // Common component names to avoid conflicts
      'Component', 'Element', 'Node', 'Props', 'State', 'Context', 'Provider',
      'Consumer', 'Fragment', 'StrictMode', 'Suspense'
    ];
    
    return reservedKeywords.includes(name.toLowerCase());
  }

  /**
   * Make name safe by avoiding reserved keywords
   */
  makeSafeName(name: string): string {
    if (this.isReservedKeyword(name)) {
      return `${name}Component`;
    }
    return name;
  }
}