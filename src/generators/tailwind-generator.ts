import { 
  ParsedComponent, 
  ParsedElement,
  GeneratorConfig, 
  GeneratedStylesheet,
  ParsedStyleSystem,
  ComputedStyles
} from '../types/generator';
import { StyleGeneratorInterface } from './core-generator';

export class TailwindGenerator implements StyleGeneratorInterface {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  async generateStyles(component: ParsedComponent, styleSystem: ParsedStyleSystem): Promise<GeneratedStylesheet | null> {
    // Tailwind doesn't generate separate style files, but we might generate custom CSS
    const customStyles = this.generateCustomStyles(component);
    
    if (!customStyles) return null;

    return {
      name: `${component.name}.custom`,
      path: `${this.config.outputDir}/${component.category}/${component.name}.custom.css`,
      content: customStyles,
      type: 'css',
      variables: {},
      mixins: []
    };
  }

  generateImports(component: ParsedComponent): string | null {
    // No import needed for Tailwind classes
    return null;
  }

  generateClassName(component: ParsedComponent): string | null {
    const classes = this.generateTailwindClasses(component.styles);
    return classes ? `"${classes}"` : null;
  }

  generateElementClassName(element: ParsedElement): string | null {
    if (element.styles && this.hasSignificantStyles(element.styles)) {
      const classes = this.generateTailwindClasses(element.styles);
      return classes ? `"${classes}"` : null;
    }
    return null;
  }

  async generateThemeStyles(styleSystem: ParsedStyleSystem): Promise<GeneratedStylesheet[]> {
    const styles: GeneratedStylesheet[] = [];

    // Generate Tailwind config
    const configContent = this.generateTailwindConfig(styleSystem);
    styles.push({
      name: 'tailwind.config',
      path: `${this.config.outputDir}/tailwind.config.js`,
      content: configContent,
      type: 'css',
      variables: {},
      mixins: []
    });

    // Generate base CSS
    const baseContent = this.generateBaseCSS(styleSystem);
    styles.push({
      name: 'base',
      path: `${this.config.outputDir}/styles/base.css`,
      content: baseContent,
      type: 'css',
      variables: {},
      mixins: []
    });

    return styles;
  }

  private generateTailwindClasses(styles: ComputedStyles): string {
    const classes: string[] = [];

    // Layout classes
    if (styles.layout) {
      classes.push(...this.convertLayoutToTailwind(styles.layout));
    }

    // Typography classes
    if (styles.typography) {
      classes.push(...this.convertTypographyToTailwind(styles.typography));
    }

    // Color classes
    if (styles.colors) {
      classes.push(...this.convertColorsToTailwind(styles.colors));
    }

    // Spacing classes
    if (styles.spacing) {
      classes.push(...this.convertSpacingToTailwind(styles.spacing));
    }

    // Border classes
    if (styles.borders) {
      classes.push(...this.convertBordersToTailwind(styles.borders));
    }

    // Shadow classes
    if (styles.shadows) {
      classes.push(...this.convertShadowsToTailwind(styles.shadows));
    }

    // Effect classes
    if (styles.effects) {
      classes.push(...this.convertEffectsToTailwind(styles.effects));
    }

    return classes.join(' ');
  }

  private convertLayoutToTailwind(layout: any): string[] {
    const classes: string[] = [];

    if (layout.display === 'flex') {
      classes.push('flex');
      
      if (layout.flexDirection === 'column') {
        classes.push('flex-col');
      } else if (layout.flexDirection === 'row') {
        classes.push('flex-row');
      }

      // Justify content
      switch (layout.justifyContent) {
        case 'center': classes.push('justify-center'); break;
        case 'flex-start': classes.push('justify-start'); break;
        case 'flex-end': classes.push('justify-end'); break;
        case 'space-between': classes.push('justify-between'); break;
        case 'space-around': classes.push('justify-around'); break;
        case 'space-evenly': classes.push('justify-evenly'); break;
      }

      // Align items
      switch (layout.alignItems) {
        case 'center': classes.push('items-center'); break;
        case 'flex-start': classes.push('items-start'); break;
        case 'flex-end': classes.push('items-end'); break;
        case 'stretch': classes.push('items-stretch'); break;
        case 'baseline': classes.push('items-baseline'); break;
      }

      // Flex wrap
      if (layout.flexWrap === 'wrap') {
        classes.push('flex-wrap');
      }

      // Gap
      if (layout.gap) {
        const gapClass = this.convertSpacingValueToTailwind(layout.gap, 'gap');
        if (gapClass) classes.push(gapClass);
      }
    } else if (layout.display === 'grid') {
      classes.push('grid');
      
      if (layout.gridTemplateColumns) {
        // This would need more sophisticated parsing
        classes.push('grid-cols-auto');
      }
    } else if (layout.display === 'block') {
      classes.push('block');
    } else if (layout.display === 'inline-block') {
      classes.push('inline-block');
    }

    // Width and height
    if (layout.width) {
      const widthClass = this.convertSizeValueToTailwind(layout.width, 'w');
      if (widthClass) classes.push(widthClass);
    }

    if (layout.height) {
      const heightClass = this.convertSizeValueToTailwind(layout.height, 'h');
      if (heightClass) classes.push(heightClass);
    }

    // Overflow
    if (layout.overflow) {
      switch (layout.overflow) {
        case 'hidden': classes.push('overflow-hidden'); break;
        case 'auto': classes.push('overflow-auto'); break;
        case 'scroll': classes.push('overflow-scroll'); break;
      }
    }

    return classes;
  }

  private convertTypographyToTailwind(typography: any): string[] {
    const classes: string[] = [];

    // Font size
    if (typography.fontSize) {
      const sizeClass = this.convertFontSizeToTailwind(typography.fontSize);
      if (sizeClass) classes.push(sizeClass);
    }

    // Font weight
    if (typography.fontWeight) {
      const weightClass = this.convertFontWeightToTailwind(typography.fontWeight);
      if (weightClass) classes.push(weightClass);
    }

    // Text align
    if (typography.textAlign) {
      switch (typography.textAlign) {
        case 'left': classes.push('text-left'); break;
        case 'center': classes.push('text-center'); break;
        case 'right': classes.push('text-right'); break;
        case 'justify': classes.push('text-justify'); break;
      }
    }

    // Text decoration
    if (typography.textDecoration) {
      switch (typography.textDecoration) {
        case 'underline': classes.push('underline'); break;
        case 'line-through': classes.push('line-through'); break;
        case 'none': classes.push('no-underline'); break;
      }
    }

    // Text transform
    if (typography.textTransform) {
      switch (typography.textTransform) {
        case 'uppercase': classes.push('uppercase'); break;
        case 'lowercase': classes.push('lowercase'); break;
        case 'capitalize': classes.push('capitalize'); break;
      }
    }

    // Line height
    if (typography.lineHeight) {
      const lineHeightClass = this.convertLineHeightToTailwind(typography.lineHeight);
      if (lineHeightClass) classes.push(lineHeightClass);
    }

    return classes;
  }

  private convertColorsToTailwind(colors: any): string[] {
    const classes: string[] = [];

    if (colors.color) {
      const textClass = this.convertColorToTailwind(colors.color, 'text');
      if (textClass) classes.push(textClass);
    }

    if (colors.backgroundColor) {
      const bgClass = this.convertColorToTailwind(colors.backgroundColor, 'bg');
      if (bgClass) classes.push(bgClass);
    }

    if (colors.borderColor) {
      const borderClass = this.convertColorToTailwind(colors.borderColor, 'border');
      if (borderClass) classes.push(borderClass);
    }

    if (colors.opacity !== undefined && colors.opacity < 1) {
      const opacityClass = this.convertOpacityToTailwind(colors.opacity);
      if (opacityClass) classes.push(opacityClass);
    }

    return classes;
  }

  private convertSpacingToTailwind(spacing: any): string[] {
    const classes: string[] = [];

    // Margin
    if (spacing.margin) {
      const marginClass = this.convertSpacingValueToTailwind(spacing.margin, 'm');
      if (marginClass) classes.push(marginClass);
    } else {
      if (spacing.marginTop) {
        const mtClass = this.convertSpacingValueToTailwind(spacing.marginTop, 'mt');
        if (mtClass) classes.push(mtClass);
      }
      if (spacing.marginRight) {
        const mrClass = this.convertSpacingValueToTailwind(spacing.marginRight, 'mr');
        if (mrClass) classes.push(mrClass);
      }
      if (spacing.marginBottom) {
        const mbClass = this.convertSpacingValueToTailwind(spacing.marginBottom, 'mb');
        if (mbClass) classes.push(mbClass);
      }
      if (spacing.marginLeft) {
        const mlClass = this.convertSpacingValueToTailwind(spacing.marginLeft, 'ml');
        if (mlClass) classes.push(mlClass);
      }
    }

    // Padding
    if (spacing.padding) {
      const paddingClass = this.convertSpacingValueToTailwind(spacing.padding, 'p');
      if (paddingClass) classes.push(paddingClass);
    } else {
      if (spacing.paddingTop) {
        const ptClass = this.convertSpacingValueToTailwind(spacing.paddingTop, 'pt');
        if (ptClass) classes.push(ptClass);
      }
      if (spacing.paddingRight) {
        const prClass = this.convertSpacingValueToTailwind(spacing.paddingRight, 'pr');
        if (prClass) classes.push(prClass);
      }
      if (spacing.paddingBottom) {
        const pbClass = this.convertSpacingValueToTailwind(spacing.paddingBottom, 'pb');
        if (pbClass) classes.push(pbClass);
      }
      if (spacing.paddingLeft) {
        const plClass = this.convertSpacingValueToTailwind(spacing.paddingLeft, 'pl');
        if (plClass) classes.push(plClass);
      }
    }

    return classes;
  }

  private convertBordersToTailwind(borders: any): string[] {
    const classes: string[] = [];

    if (borders.borderWidth) {
      const borderClass = this.convertBorderWidthToTailwind(borders.borderWidth);
      if (borderClass) classes.push(borderClass);
    }

    if (borders.borderRadius) {
      const radiusClass = this.convertBorderRadiusToTailwind(borders.borderRadius);
      if (radiusClass) classes.push(radiusClass);
    }

    if (borders.borderStyle === 'dashed') {
      classes.push('border-dashed');
    } else if (borders.borderStyle === 'dotted') {
      classes.push('border-dotted');
    }

    return classes;
  }

  private convertShadowsToTailwind(shadows: any): string[] {
    const classes: string[] = [];

    if (shadows.boxShadow) {
      const shadowClass = this.convertBoxShadowToTailwind(shadows.boxShadow);
      if (shadowClass) classes.push(shadowClass);
    }

    return classes;
  }

  private convertEffectsToTailwind(effects: any): string[] {
    const classes: string[] = [];

    if (effects.filter) {
      if (effects.filter.includes('blur')) {
        classes.push('blur');
      }
    }

    if (effects.transform) {
      // This would need more sophisticated parsing
      if (effects.transform.includes('rotate')) {
        classes.push('transform', 'rotate-0'); // Default, would need actual value
      }
    }

    return classes;
  }

  // Helper methods for value conversion

  private convertSpacingValueToTailwind(value: string, prefix: string): string | null {
    const numValue = parseInt(value.replace('px', ''));
    
    // Tailwind spacing scale (4px increments)
    const spacingMap: Record<number, string> = {
      0: '0',
      4: '1',
      8: '2',
      12: '3',
      16: '4',
      20: '5',
      24: '6',
      28: '7',
      32: '8',
      36: '9',
      40: '10',
      44: '11',
      48: '12',
      56: '14',
      64: '16',
      80: '20',
      96: '24',
      112: '28',
      128: '32'
    };

    const tailwindValue = spacingMap[numValue];
    return tailwindValue ? `${prefix}-${tailwindValue}` : null;
  }

  private convertSizeValueToTailwind(value: string, prefix: string): string | null {
    if (value === '100%') return `${prefix}-full`;
    if (value === 'auto') return `${prefix}-auto`;
    
    const numValue = parseInt(value.replace('px', ''));
    
    if (numValue % 4 === 0) {
      const tailwindValue = numValue / 4;
      return `${prefix}-${tailwindValue}`;
    }
    
    return null;
  }

  private convertFontSizeToTailwind(fontSize: string): string | null {
    const fontSizeMap: Record<string, string> = {
      '12px': 'text-xs',
      '14px': 'text-sm',
      '16px': 'text-base',
      '18px': 'text-lg',
      '20px': 'text-xl',
      '24px': 'text-2xl',
      '30px': 'text-3xl',
      '36px': 'text-4xl',
      '48px': 'text-5xl',
      '60px': 'text-6xl'
    };

    return fontSizeMap[fontSize] || null;
  }

  private convertFontWeightToTailwind(fontWeight: number): string | null {
    const weightMap: Record<number, string> = {
      100: 'font-thin',
      200: 'font-extralight',
      300: 'font-light',
      400: 'font-normal',
      500: 'font-medium',
      600: 'font-semibold',
      700: 'font-bold',
      800: 'font-extrabold',
      900: 'font-black'
    };

    return weightMap[fontWeight] || null;
  }

  private convertColorToTailwind(color: string, prefix: string): string | null {
    // This would need a more sophisticated color matching system
    // For now, return null to use custom CSS
    return null;
  }

  private convertOpacityToTailwind(opacity: number): string | null {
    const opacityValue = Math.round(opacity * 100);
    
    if (opacityValue % 5 === 0) {
      return `opacity-${opacityValue}`;
    }
    
    return null;
  }

  private convertLineHeightToTailwind(lineHeight: number): string | null {
    const lineHeightMap: Record<number, string> = {
      1: 'leading-none',
      1.25: 'leading-tight',
      1.375: 'leading-snug',
      1.5: 'leading-normal',
      1.625: 'leading-relaxed',
      2: 'leading-loose'
    };

    return lineHeightMap[lineHeight] || null;
  }

  private convertBorderWidthToTailwind(borderWidth: string): string | null {
    const widthMap: Record<string, string> = {
      '0px': 'border-0',
      '1px': 'border',
      '2px': 'border-2',
      '4px': 'border-4',
      '8px': 'border-8'
    };

    return widthMap[borderWidth] || null;
  }

  private convertBorderRadiusToTailwind(borderRadius: string): string | null {
    const radiusMap: Record<string, string> = {
      '0px': 'rounded-none',
      '2px': 'rounded-sm',
      '4px': 'rounded',
      '6px': 'rounded-md',
      '8px': 'rounded-lg',
      '12px': 'rounded-xl',
      '16px': 'rounded-2xl',
      '24px': 'rounded-3xl',
      '50%': 'rounded-full'
    };

    return radiusMap[borderRadius] || null;
  }

  private convertBoxShadowToTailwind(boxShadow: string): string | null {
    // Simplified shadow mapping
    if (boxShadow.includes('0px 1px')) return 'shadow-sm';
    if (boxShadow.includes('0px 4px')) return 'shadow';
    if (boxShadow.includes('0px 10px')) return 'shadow-md';
    if (boxShadow.includes('0px 20px')) return 'shadow-lg';
    if (boxShadow.includes('0px 30px')) return 'shadow-xl';
    
    return null;
  }

  private generateTailwindConfig(styleSystem: ParsedStyleSystem): string {
    const colors = this.generateTailwindColors(styleSystem.colors);
    const typography = this.generateTailwindTypography(styleSystem.typography);
    const spacing = this.generateTailwindSpacing(styleSystem.spacing);

    return `module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
${colors}
      },
      fontFamily: {
${typography.fontFamily}
      },
      fontSize: {
${typography.fontSize}
      },
      spacing: {
${spacing}
      }
    },
  },
  plugins: [],
}`;
  }

  private generateTailwindColors(colors: any): string {
    const colorEntries = Object.entries(colors).map(([key, palette]: [string, any]) => {
      if (typeof palette === 'object' && palette !== null) {
        const paletteEntries = Object.entries(palette).map(([shade, color]) => {
          return `          ${shade}: '${color}',`;
        }).join('\n');
        return `        ${key}: {
${paletteEntries}
        },`;
      } else {
        return `        ${key}: '${palette}',`;
      }
    }).join('\n');

    return colorEntries;
  }

  private generateTailwindTypography(typography: any): { fontFamily: string; fontSize: string } {
    const fontFamily = Object.entries(typography.fontFamilies || {}).map(([key, family]) => {
      return `        ${key}: ${JSON.stringify(family.split(', '))},`;
    }).join('\n');

    const fontSize = Object.entries(typography.fontSizes || {}).map(([key, size]) => {
      return `        ${key}: '${size}',`;
    }).join('\n');

    return { fontFamily, fontSize };
  }

  private generateTailwindSpacing(spacing: any): string {
    return Object.entries(spacing.scale || {}).map(([key, value]) => {
      return `        '${key}': '${value}',`;
    }).join('\n');
  }

  private generateBaseCSS(styleSystem: ParsedStyleSystem): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: ${Object.values(styleSystem.typography.fontFamilies || {})[0] || 'system-ui, sans-serif'};
  }
}

@layer components {
  /* Custom component styles can be added here */
}`;
  }

  private generateCustomStyles(component: ParsedComponent): string | null {
    // Generate custom CSS for styles that can't be represented with Tailwind classes
    const customRules: string[] = [];

    // This would contain CSS that can't be represented with standard Tailwind classes
    // For example, complex gradients, custom animations, etc.

    return customRules.length > 0 ? customRules.join('\n\n') : null;
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