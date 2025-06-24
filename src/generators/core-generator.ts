import { 
  ParsedDesign, 
  ParsedComponent, 
  ParsedElement, 
  GeneratorConfig, 
  GenerationResult,
  GeneratedComponent,
  GeneratedStylesheet,
  GeneratedAsset,
  GeneratedType,
  GenerationMetadata,
  GenerationStats,
  StyleApproach
} from '../types/generator';
import { StyledComponentsGenerator } from './styled-components-generator';
import { CSSModulesGenerator } from './css-modules-generator';
import { TailwindGenerator } from './tailwind-generator';
import { InlineStylesGenerator } from './inline-styles-generator';
import { TypeScriptGenerator } from './typescript-generator';
import { AssetGenerator } from './asset-generator';
import { ComponentNamer } from '../utils/component-namer';
import { FileOrganizer } from '../utils/file-organizer';

export class CoreGenerator {
  private config: GeneratorConfig;
  private styleGenerator: StyleGeneratorInterface;
  private typeScriptGenerator: TypeScriptGenerator;
  private assetGenerator: AssetGenerator;
  private componentNamer: ComponentNamer;
  private fileOrganizer: FileOrganizer;

  constructor(config: GeneratorConfig) {
    this.config = config;
    this.styleGenerator = this.createStyleGenerator(config.styleApproach);
    this.typeScriptGenerator = new TypeScriptGenerator(config);
    this.assetGenerator = new AssetGenerator(config);
    this.componentNamer = new ComponentNamer(config);
    this.fileOrganizer = new FileOrganizer(config);
  }

  /**
   * Generate complete React codebase from parsed design
   */
  async generateCode(design: ParsedDesign): Promise<GenerationResult> {
    console.log(`🚀 Generating ${this.config.framework} components with ${this.config.styleApproach} styling...`);
    
    const startTime = Date.now();
    const components: GeneratedComponent[] = [];
    const styles: GeneratedStylesheet[] = [];
    const assets: GeneratedAsset[] = [];
    const types: GeneratedType[] = [];
    const errors: any[] = [];
    const warnings: any[] = [];

    try {
      // Generate theme and style system
      const themeStyles = await this.generateThemeStyles(design);
      styles.push(...themeStyles);

      // Generate components
      for (const component of design.components) {
        try {
          const generated = await this.generateComponent(component, design);
          components.push(generated.component);
          
          if (generated.styles) {
            styles.push(generated.styles);
          }
          
          if (generated.types && this.config.useTypeScript) {
            types.push(generated.types);
          }
        } catch (error) {
          console.error(`❌ Failed to generate component ${component.name}:`, error);
          errors.push({
            type: 'generation',
            message: `Failed to generate component ${component.name}: ${error.message}`,
            node: component
          });
        }
      }

      // Generate assets
      try {
        const generatedAssets = await this.assetGenerator.generateAssets(design.assets);
        assets.push(...generatedAssets);
      } catch (error) {
        console.warn(`⚠️ Asset generation failed:`, error);
        warnings.push({
          type: 'performance',
          message: `Some assets could not be optimized: ${error.message}`
        });
      }

      // Generate TypeScript types
      if (this.config.useTypeScript) {
        try {
          const globalTypes = this.typeScriptGenerator.generateGlobalTypes(design);
          types.push(globalTypes);
        } catch (error) {
          console.error(`❌ TypeScript generation failed:`, error);
          errors.push({
            type: 'generation',
            message: `TypeScript generation failed: ${error.message}`
          });
        }
      }

      // Generate index files and barrel exports
      const indexFiles = this.generateIndexFiles(components);
      components.push(...indexFiles);

      const generationTime = Date.now() - startTime;
      
      const stats: GenerationStats = {
        totalComponents: components.length,
        componentsByType: this.calculateComponentsByType(components),
        totalStyles: styles.length,
        totalAssets: assets.length,
        totalLines: this.calculateTotalLines(components),
        generationTime
      };

      const metadata: GenerationMetadata = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        config: this.config,
        stats
      };

      console.log(`✅ Generated ${components.length} components in ${generationTime}ms`);

      return {
        success: errors.length === 0,
        components,
        styles,
        assets,
        types: this.config.useTypeScript ? types : undefined,
        metadata,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      console.error(`💥 Generation failed:`, error);
      
      return {
        success: false,
        components: [],
        styles: [],
        assets: [],
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          config: this.config,
          stats: {
            totalComponents: 0,
            componentsByType: {} as Record<string, number>,
            totalStyles: 0,
            totalAssets: 0,
            totalLines: 0,
            generationTime: Date.now() - startTime
          }
        },
        errors: [{
          type: 'generation',
          message: `Critical generation failure: ${error.message}`,
          stack: error.stack
        }]
      };
    }
  }

  /**
   * Generate individual component
   */
  private async generateComponent(
    component: ParsedComponent, 
    design: ParsedDesign
  ): Promise<{
    component: GeneratedComponent;
    styles?: GeneratedStylesheet;
    types?: GeneratedType;
  }> {
    const componentName = this.componentNamer.generateComponentName(component);
    const fileName = this.componentNamer.generateFileName(component);
    
    // Generate component code
    const componentCode = this.generateComponentCode(component, componentName);
    
    // Generate styles
    const styleResult = await this.styleGenerator.generateStyles(component, design.styles);
    
    // Generate TypeScript types
    let typesResult;
    if (this.config.useTypeScript) {
      typesResult = this.typeScriptGenerator.generateComponentTypes(component);
    }

    // Generate stories (if Storybook is enabled)
    let stories;
    if (this.config.plugins?.some(p => p.name === 'storybook')) {
      stories = this.generateStorybook(component, componentName);
    }

    // Generate tests (if testing is enabled)
    let tests;
    if (this.config.plugins?.some(p => p.name === 'testing')) {
      tests = this.generateTests(component, componentName);
    }

    const generatedComponent: GeneratedComponent = {
      name: componentName,
      path: this.fileOrganizer.getComponentPath(component, fileName),
      content: componentCode,
      dependencies: this.extractDependencies(component),
      exports: [componentName],
      type: component.type,
      category: component.category,
      props: component.props,
      stories,
      tests
    };

    return {
      component: generatedComponent,
      styles: styleResult,
      types: typesResult
    };
  }

  /**
   * Generate React component code
   */
  private generateComponentCode(component: ParsedComponent, componentName: string): string {
    const imports = this.generateImports(component);
    const props = this.generatePropsInterface(component);
    const componentBody = this.generateComponentBody(component);
    const exports = this.generateExports(componentName);

    return `${imports}

${props}

${componentBody}

${exports}`.trim();
  }

  /**
   * Generate import statements
   */
  private generateImports(component: ParsedComponent): string {
    const imports: string[] = [];
    
    // React imports
    const reactImports = ['React'];
    if (this.hasStateOrEffects(component)) {
      reactImports.push('useState', 'useEffect');
    }
    imports.push(`import ${reactImports.join(', ')} from 'react';`);

    // Style imports
    const styleImports = this.styleGenerator.generateImports(component);
    if (styleImports) {
      imports.push(styleImports);
    }

    // Component imports
    const childComponents = this.getChildComponentImports(component);
    childComponents.forEach(imp => imports.push(imp));

    // Utility imports
    if (this.needsUtilityImports(component)) {
      imports.push(`import { cn } from '../utils/cn';`);
    }

    return imports.join('\n');
  }

  /**
   * Generate props interface
   */
  private generatePropsInterface(component: ParsedComponent): string {
    if (!this.config.useTypeScript) return '';

    const props = component.props.map(prop => {
      const optional = prop.required ? '' : '?';
      const defaultValue = prop.defaultValue ? ` // default: ${JSON.stringify(prop.defaultValue)}` : '';
      return `  ${prop.name}${optional}: ${this.mapPropType(prop.type)};${defaultValue}`;
    }).join('\n');

    const interfaceName = `${component.name}Props`;
    
    return `interface ${interfaceName} {
${props}
}`;
  }

  /**
   * Generate component body
   */
  private generateComponentBody(component: ParsedComponent): string {
    const componentName = this.componentNamer.generateComponentName(component);
    const propsParam = this.config.useTypeScript ? 
      `props: ${component.name}Props` : 'props';

    const destructuredProps = this.generateDestructuredProps(component);
    const componentContent = this.generateComponentContent(component);
    const accessibility = this.generateAccessibilityProps(component);

    return `export const ${componentName} = (${propsParam}) => {
  ${destructuredProps}

  return (
    ${componentContent}
  );
};`;
  }

  /**
   * Generate component content (JSX)
   */
  private generateComponentContent(component: ParsedComponent): string {
    const tagName = this.getComponentTagName(component);
    const className = this.styleGenerator.generateClassName(component);
    const attributes = this.generateAttributes(component);
    const children = this.generateChildren(component);

    const props = [
      className ? `className={${className}}` : '',
      ...attributes,
      ...this.generateAccessibilityProps(component)
    ].filter(Boolean).join('\n      ');

    if (children.trim()) {
      return `<${tagName}${props ? `\n      ${props}` : ''}>
      ${children}
    </${tagName}>`;
    } else {
      return `<${tagName}${props ? `\n      ${props}` : ''} />`;
    }
  }

  /**
   * Generate child elements
   */
  private generateChildren(component: ParsedComponent): string {
    return component.children.map(child => this.generateElement(child)).join('\n      ');
  }

  /**
   * Generate individual element
   */
  private generateElement(element: ParsedElement): string {
    const tagName = element.tagName;
    const className = this.styleGenerator.generateElementClassName(element);
    const attributes = this.generateElementAttributes(element);
    const content = element.content || '';
    const children = element.children.map(child => this.generateElement(child)).join('\n        ');

    const props = [
      className ? `className={${className}}` : '',
      ...attributes
    ].filter(Boolean).join(' ');

    if (content) {
      return `<${tagName}${props ? ` ${props}` : ''}>${content}</${tagName}>`;
    } else if (children) {
      return `<${tagName}${props ? ` ${props}` : ''}>
        ${children}
      </${tagName}>`;
    } else {
      return `<${tagName}${props ? ` ${props}` : ''} />`;
    }
  }

  /**
   * Generate theme and global styles
   */
  private async generateThemeStyles(design: ParsedDesign): Promise<GeneratedStylesheet[]> {
    return this.styleGenerator.generateThemeStyles(design.styles);
  }

  /**
   * Generate index files for barrel exports
   */
  private generateIndexFiles(components: GeneratedComponent[]): GeneratedComponent[] {
    const indexFiles: GeneratedComponent[] = [];
    
    // Group components by category
    const componentsByCategory = components.reduce((acc, comp) => {
      if (!acc[comp.category]) acc[comp.category] = [];
      acc[comp.category].push(comp);
      return acc;
    }, {} as Record<string, GeneratedComponent[]>);

    // Generate category index files
    Object.entries(componentsByCategory).forEach(([category, comps]) => {
      const exports = comps.map(comp => `export { ${comp.name} } from './${comp.name}';`).join('\n');
      
      indexFiles.push({
        name: 'index',
        path: `${this.config.outputDir}/${category}/index.ts`,
        content: exports,
        dependencies: [],
        exports: comps.map(c => c.name),
        type: 'ui',
        category: 'other',
        props: []
      });
    });

    // Generate root index file
    const rootExports = Object.keys(componentsByCategory)
      .map(category => `export * from './${category}';`)
      .join('\n');

    indexFiles.push({
      name: 'index',
      path: `${this.config.outputDir}/index.ts`,
      content: rootExports,
      dependencies: [],
      exports: components.map(c => c.name),
      type: 'ui',
      category: 'other',
      props: []
    });

    return indexFiles;
  }

  // Helper methods

  private createStyleGenerator(approach: StyleApproach): StyleGeneratorInterface {
    switch (approach) {
      case 'styled-components':
        return new StyledComponentsGenerator(this.config);
      case 'css-modules':
        return new CSSModulesGenerator(this.config);
      case 'tailwind':
        return new TailwindGenerator(this.config);
      case 'inline':
        return new InlineStylesGenerator(this.config);
      default:
        throw new Error(`Unsupported style approach: ${approach}`);
    }
  }

  private hasStateOrEffects(component: ParsedComponent): boolean {
    // Check if component needs state or effects
    return component.category === 'input' || 
           component.category === 'form' ||
           component.category === 'modal' ||
           component.category === 'tabs' ||
           component.category === 'carousel';
  }

  private getChildComponentImports(component: ParsedComponent): string[] {
    const imports: string[] = [];
    // This would analyze child components and generate appropriate imports
    return imports;
  }

  private needsUtilityImports(component: ParsedComponent): boolean {
    return this.config.styleApproach === 'tailwind' || 
           this.config.styleApproach === 'css-modules';
  }

  private mapPropType(type: string): string {
    switch (type) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'array': return 'any[]';
      case 'object': return 'object';
      case 'function': return '() => void';
      case 'color': return 'string';
      case 'size': return 'string | number';
      case 'spacing': return 'string | number';
      case 'variant': return 'string';
      default: return 'any';
    }
  }

  private generateDestructuredProps(component: ParsedComponent): string {
    const props = component.props.map(prop => {
      const defaultValue = prop.defaultValue ? ` = ${JSON.stringify(prop.defaultValue)}` : '';
      return `${prop.name}${defaultValue}`;
    }).join(', ');

    return props ? `const { ${props} } = props;` : '';
  }

  private getComponentTagName(component: ParsedComponent): string {
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

  private generateAttributes(component: ParsedComponent): string[] {
    const attributes: string[] = [];
    
    // Add component-specific attributes
    switch (component.category) {
      case 'button':
        attributes.push('type="button"');
        break;
      case 'input':
        attributes.push('type="text"');
        break;
      case 'image':
        attributes.push('alt=""');
        break;
    }

    return attributes;
  }

  private generateElementAttributes(element: ParsedElement): string[] {
    const attributes: string[] = [];
    
    element.props.forEach(prop => {
      if (prop.name === 'children') return;
      attributes.push(`${prop.name}="${prop.value}"`);
    });

    return attributes;
  }

  private generateAccessibilityProps(component: ParsedComponent): string[] {
    const props: string[] = [];
    
    if (component.accessibility) {
      const acc = component.accessibility;
      if (acc.role) props.push(`role="${acc.role}"`);
      if (acc.ariaLabel) props.push(`aria-label="${acc.ariaLabel}"`);
      if (acc.ariaDescribedBy) props.push(`aria-describedby="${acc.ariaDescribedBy}"`);
      if (acc.tabIndex !== undefined) props.push(`tabIndex={${acc.tabIndex}}`);
    }

    return props;
  }

  private generateExports(componentName: string): string {
    return `export default ${componentName};`;
  }

  private generateStorybook(component: ParsedComponent, componentName: string): string {
    // Generate Storybook stories
    return `// Storybook stories for ${componentName}`;
  }

  private generateTests(component: ParsedComponent, componentName: string): string {
    // Generate unit tests
    return `// Unit tests for ${componentName}`;
  }

  private extractDependencies(component: ParsedComponent): string[] {
    const deps = ['react'];
    
    if (this.config.styleApproach === 'styled-components') {
      deps.push('styled-components');
    }
    
    return deps;
  }

  private calculateComponentsByType(components: GeneratedComponent[]): Record<string, number> {
    return components.reduce((acc, comp) => {
      acc[comp.type] = (acc[comp.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateTotalLines(components: GeneratedComponent[]): number {
    return components.reduce((total, comp) => {
      return total + comp.content.split('\n').length;
    }, 0);
  }
}

// Interface for style generators
export interface StyleGeneratorInterface {
  generateStyles(component: ParsedComponent, styleSystem: any): Promise<GeneratedStylesheet | undefined>;
  generateImports(component: ParsedComponent): string | undefined;
  generateClassName(component: ParsedComponent): string | undefined;
  generateElementClassName(element: ParsedElement): string | undefined;
  generateThemeStyles(styleSystem: any): Promise<GeneratedStylesheet[]>;
}