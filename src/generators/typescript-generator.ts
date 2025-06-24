import { 
  ParsedComponent, 
  ParsedDesign,
  GeneratorConfig, 
  GeneratedType,
  ComponentProp,
  PropType
} from '../types/generator';

export class TypeScriptGenerator {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  /**
   * Generate TypeScript types for a component
   */
  generateComponentTypes(component: ParsedComponent): GeneratedType {
    const interfaces = this.generateComponentInterfaces(component);
    const types = this.generateComponentTypes_(component);
    const enums = this.generateComponentEnums(component);

    const content = [
      this.generateImports(),
      interfaces,
      types,
      enums
    ].filter(Boolean).join('\n\n');

    return {
      name: `${component.name}.types`,
      path: `${this.config.outputDir}/${component.category}/${component.name}.types.ts`,
      content,
      interfaces: [component.name + 'Props'],
      types: types ? [component.name + 'Variant', component.name + 'Size'] : [],
      enums: enums ? [component.name + 'State'] : []
    };
  }

  /**
   * Generate global types for the design system
   */
  generateGlobalTypes(design: ParsedDesign): GeneratedType {
    const interfaces = this.generateGlobalInterfaces(design);
    const types = this.generateGlobalTypes_(design);
    const enums = this.generateGlobalEnums();

    const content = [
      this.generateGlobalImports(),
      interfaces,
      types,
      enums
    ].filter(Boolean).join('\n\n');

    return {
      name: 'global',
      path: `${this.config.outputDir}/types/global.ts`,
      content,
      interfaces: ['ThemeConfig', 'ComponentProps', 'StyleProps'],
      types: ['ComponentVariant', 'ComponentSize', 'SpacingValue'],
      enums: ['ComponentState']
    };
  }

  private generateImports(): string {
    return `import React from 'react';`;
  }

  private generateGlobalImports(): string {
    return `import React from 'react';
import { CSSProperties } from 'react';`;
  }

  private generateComponentInterfaces(component: ParsedComponent): string {
    const propsInterface = this.generatePropsInterface(component);
    const stylePropsInterface = this.generateStylePropsInterface(component);
    
    return [propsInterface, stylePropsInterface].filter(Boolean).join('\n\n');
  }

  private generatePropsInterface(component: ParsedComponent): string {
    const baseProps = this.generateBaseProps(component);
    const customProps = component.props.map(prop => this.generatePropDefinition(prop)).join('\n  ');
    const commonProps = this.generateCommonProps(component);

    return `export interface ${component.name}Props {
  ${baseProps}
  ${customProps}
  ${commonProps}
}`;
  }

  private generateStylePropsInterface(component: ParsedComponent): string {
    if (this.config.styleApproach === 'inline') {
      return `export interface ${component.name}StyleProps {
  style?: CSSProperties;
  className?: string;
}`;
    }
    return '';
  }

  private generateBaseProps(component: ParsedComponent): string {
    const baseProps: string[] = [];

    // Common React props
    baseProps.push('children?: React.ReactNode;');
    baseProps.push('className?: string;');
    
    if (this.config.styleApproach === 'inline') {
      baseProps.push('style?: CSSProperties;');
    }

    // Event handlers based on component type
    if (component.category === 'button') {
      baseProps.push('onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;');
      baseProps.push('onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;');
      baseProps.push('onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;');
    } else if (component.category === 'input') {
      baseProps.push('onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;');
      baseProps.push('onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;');
      baseProps.push('onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;');
    }

    return baseProps.join('\n  ');
  }

  private generatePropDefinition(prop: ComponentProp): string {
    const optional = prop.required ? '' : '?';
    const type = this.mapPropTypeToTypeScript(prop.type, prop);
    const comment = prop.description ? ` // ${prop.description}` : '';
    const defaultComment = prop.defaultValue !== undefined ? ` @default ${JSON.stringify(prop.defaultValue)}` : '';
    
    let definition = `${prop.name}${optional}: ${type};${comment}`;
    
    if (defaultComment) {
      definition = `/**
   * ${prop.description || `${prop.name} prop`}${defaultComment}
   */
  ${definition}`;
    }

    return definition;
  }

  private generateCommonProps(component: ParsedComponent): string {
    const commonProps: string[] = [];

    // Accessibility props
    commonProps.push('id?: string;');
    commonProps.push('role?: string;');
    commonProps.push('\'aria-label\'?: string;');
    commonProps.push('\'aria-describedby\'?: string;');
    commonProps.push('tabIndex?: number;');

    // Data attributes
    commonProps.push('[key: `data-${string}`]: any;');

    return commonProps.join('\n  ');
  }

  private generateComponentTypes_(component: ParsedComponent): string | null {
    const types: string[] = [];

    // Variant type
    const variantProp = component.props.find(p => p.name === 'variant');
    if (variantProp && variantProp.options) {
      const variants = variantProp.options.map(option => `'${option.value}'`).join(' | ');
      types.push(`export type ${component.name}Variant = ${variants};`);
    }

    // Size type
    const sizeProp = component.props.find(p => p.name === 'size');
    if (sizeProp && sizeProp.options) {
      const sizes = sizeProp.options.map(option => `'${option.value}'`).join(' | ');
      types.push(`export type ${component.name}Size = ${sizes};`);
    }

    // State type
    if (this.hasInteractiveStates(component)) {
      types.push(`export type ${component.name}State = 'idle' | 'hover' | 'focus' | 'active' | 'disabled';`);
    }

    return types.length > 0 ? types.join('\n\n') : null;
  }

  private generateComponentEnums(component: ParsedComponent): string | null {
    const enums: string[] = [];

    // Component state enum
    if (this.hasInteractiveStates(component)) {
      enums.push(`export enum ${component.name}State {
  Idle = 'idle',
  Hover = 'hover',
  Focus = 'focus',
  Active = 'active',
  Disabled = 'disabled'
}`);
    }

    return enums.length > 0 ? enums.join('\n\n') : null;
  }

  private generateGlobalInterfaces(design: ParsedDesign): string {
    const interfaces: string[] = [];

    // Theme configuration interface
    interfaces.push(this.generateThemeInterface(design));

    // Component props base interface
    interfaces.push(`export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  style?: CSSProperties;
  id?: string;
  'data-testid'?: string;
}`);

    // Style props interface
    interfaces.push(`export interface StyleProps {
  margin?: SpacingValue;
  padding?: SpacingValue;
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontWeight?: number;
}`);

    return interfaces.join('\n\n');
  }

  private generateThemeInterface(design: ParsedDesign): string {
    const colorTypes = this.generateColorTypes(design.styles.colors);
    const typographyTypes = this.generateTypographyTypes(design.styles.typography);
    const spacingTypes = this.generateSpacingTypes(design.styles.spacing);

    return `export interface ThemeConfig {
  colors: {
${colorTypes}
  };
  typography: {
${typographyTypes}
  };
  spacing: {
${spacingTypes}
  };
  shadows: Record<string, string>;
  borders: {
    widths: Record<string, string>;
    styles: Record<string, string>;
    radii: Record<string, string>;
  };
}`;
  }

  private generateColorTypes(colors: any): string {
    return Object.keys(colors).map(colorKey => {
      if (typeof colors[colorKey] === 'object') {
        const shades = Object.keys(colors[colorKey]).map(shade => `${shade}: string;`).join('\n      ');
        return `    ${colorKey}: {
      ${shades}
    };`;
      } else {
        return `    ${colorKey}: string;`;
      }
    }).join('\n');
  }

  private generateTypographyTypes(typography: any): string {
    return `    fontFamilies: Record<string, string>;
    fontSizes: Record<string, string>;
    fontWeights: Record<string, number>;
    lineHeights: Record<string, number>;
    letterSpacings: Record<string, string>;`;
  }

  private generateSpacingTypes(spacing: any): string {
    return Object.keys(spacing.scale || {}).map(key => `${key}: string;`).join('\n    ');
  }

  private generateGlobalTypes_(design: ParsedDesign): string {
    const types: string[] = [];

    // Component variant types
    types.push(`export type ComponentVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';`);

    // Component size types
    types.push(`export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`);

    // Spacing value types
    const spacingKeys = Object.keys(design.styles.spacing.scale || {});
    if (spacingKeys.length > 0) {
      const spacingUnion = spacingKeys.map(key => `'${key}'`).join(' | ');
      types.push(`export type SpacingValue = ${spacingUnion} | string | number;`);
    } else {
      types.push(`export type SpacingValue = string | number;`);
    }

    // Color value types
    types.push(`export type ColorValue = string;`);

    // Responsive breakpoint types
    types.push(`export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`);

    // Layout types
    types.push(`export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';`);
    types.push(`export type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';`);
    types.push(`export type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';`);

    return types.join('\n\n');
  }

  private generateGlobalEnums(): string {
    const enums: string[] = [];

    // Component state enum
    enums.push(`export enum ComponentState {
  Idle = 'idle',
  Hover = 'hover',
  Focus = 'focus',
  Active = 'active',
  Disabled = 'disabled',
  Loading = 'loading'
}`);

    // Alignment enum
    enums.push(`export enum Alignment {
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Justify = 'justify'
}`);

    return enums.join('\n\n');
  }

  private mapPropTypeToTypeScript(propType: PropType, prop: ComponentProp): string {
    switch (propType) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return 'any[]';
      case 'object':
        return 'Record<string, any>';
      case 'function':
        return '(...args: any[]) => any';
      case 'enum':
        if (prop.options && prop.options.length > 0) {
          return prop.options.map(option => `'${option.value}'`).join(' | ');
        }
        return 'string';
      case 'color':
        return 'string';
      case 'size':
        return 'string | number';
      case 'spacing':
        return 'SpacingValue';
      case 'variant':
        if (prop.options && prop.options.length > 0) {
          return prop.options.map(option => `'${option.value}'`).join(' | ');
        }
        return 'ComponentVariant';
      default:
        return 'any';
    }
  }

  private hasInteractiveStates(component: ParsedComponent): boolean {
    return ['button', 'input', 'textarea', 'select', 'checkbox', 'radio', 'toggle', 'slider', 'link'].includes(component.category);
  }

  /**
   * Generate utility types for style props
   */
  generateUtilityTypes(): string {
    return `// Utility types for component styling
export type Responsive<T> = T | { xs?: T; sm?: T; md?: T; lg?: T; xl?: T };

export type StyleSystemProps = {
  m?: Responsive<SpacingValue>;
  mt?: Responsive<SpacingValue>;
  mr?: Responsive<SpacingValue>;
  mb?: Responsive<SpacingValue>;
  ml?: Responsive<SpacingValue>;
  mx?: Responsive<SpacingValue>;
  my?: Responsive<SpacingValue>;
  p?: Responsive<SpacingValue>;
  pt?: Responsive<SpacingValue>;
  pr?: Responsive<SpacingValue>;
  pb?: Responsive<SpacingValue>;
  pl?: Responsive<SpacingValue>;
  px?: Responsive<SpacingValue>;
  py?: Responsive<SpacingValue>;
  color?: Responsive<ColorValue>;
  bg?: Responsive<ColorValue>;
  fontSize?: Responsive<string>;
  fontWeight?: Responsive<number>;
  lineHeight?: Responsive<number>;
  textAlign?: Responsive<'left' | 'center' | 'right' | 'justify'>;
  width?: Responsive<string | number>;
  height?: Responsive<string | number>;
  minWidth?: Responsive<string | number>;
  minHeight?: Responsive<string | number>;
  maxWidth?: Responsive<string | number>;
  maxHeight?: Responsive<string | number>;
};

export type PolymorphicProps<T extends React.ElementType = React.ElementType> = {
  as?: T;
} & React.ComponentPropsWithoutRef<T>;

export type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;`;
  }

  /**
   * Generate component ref types
   */
  generateRefTypes(component: ParsedComponent): string {
    const elementType = this.getElementType(component);
    
    return `export type ${component.name}Ref = React.Ref<${elementType}>;

export type ${component.name}Element = ${elementType};`;
  }

  private getElementType(component: ParsedComponent): string {
    switch (component.category) {
      case 'button':
        return 'HTMLButtonElement';
      case 'input':
        return 'HTMLInputElement';
      case 'textarea':
        return 'HTMLTextAreaElement';
      case 'select':
        return 'HTMLSelectElement';
      case 'form':
        return 'HTMLFormElement';
      case 'image':
        return 'HTMLImageElement';
      case 'link':
        return 'HTMLAnchorElement';
      default:
        return 'HTMLDivElement';
    }
  }
}