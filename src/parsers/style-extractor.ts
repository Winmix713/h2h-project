import { FigmaNode, Color, Paint, Effect, TypeStyle } from '../types/figma';
import {
  ComputedStyles,
  LayoutStyles,
  TypographyStyles,
  ColorStyles,
  SpacingStyles,
  BorderStyles,
  ShadowStyles,
  EffectStyles,
  ResponsiveStyles
} from '../types/generator';

export class StyleExtractor {
  /**
   * Compute comprehensive styles for a node
   */
  computeStyles(node: FigmaNode): ComputedStyles {
    const layout = this.extractLayoutStyles(node);
    const typography = this.extractTypographyStyles(node);
    const colors = this.extractColorStyles(node);
    const spacing = this.extractSpacingStyles(node);
    const borders = this.extractBorderStyles(node);
    const shadows = this.extractShadowStyles(node);
    const effects = this.extractEffectStyles(node);
    const responsive = this.extractResponsiveStyles(node);

    return {
      layout,
      typography,
      colors,
      spacing,
      borders,
      shadows,
      effects,
      responsive
    };
  }

  /**
   * Extract layout-related styles
   */
  private extractLayoutStyles(node: FigmaNode): LayoutStyles {
    const styles: LayoutStyles = {
      display: this.getDisplayType(node)
    };

    // Position
    if (node.absoluteBoundingBox) {
      const bounds = node.absoluteBoundingBox;
      styles.width = `${bounds.width}px`;
      styles.height = `${bounds.height}px`;
    }

    // Flexbox properties
    if (node.layoutMode === 'HORIZONTAL') {
      styles.display = 'flex';
      styles.flexDirection = 'row';
    } else if (node.layoutMode === 'VERTICAL') {
      styles.display = 'flex';
      styles.flexDirection = 'column';
    }

    // Alignment
    if (node.primaryAxisAlignItems) {
      styles.justifyContent = this.mapPrimaryAxisAlignment(node.primaryAxisAlignItems);
    }

    if (node.counterAxisAlignItems) {
      styles.alignItems = this.mapCounterAxisAlignment(node.counterAxisAlignItems);
    }

    // Flex wrap
    if (node.layoutWrap === 'WRAP') {
      styles.flexWrap = 'wrap';
    }

    // Gap
    if (node.itemSpacing) {
      styles.gap = `${node.itemSpacing}px`;
    }

    // Overflow
    if (node.overflowDirection) {
      styles.overflow = this.mapOverflowDirection(node.overflowDirection);
    }

    // Z-index (approximate from layer order)
    if (node.opacity !== undefined && node.opacity < 1) {
      styles.zIndex = Math.round((1 - node.opacity) * 100);
    }

    return styles;
  }

  /**
   * Extract typography styles
   */
  private extractTypographyStyles(node: FigmaNode): TypographyStyles | undefined {
    if (node.type !== 'TEXT' || !node.style) {
      return undefined;
    }

    const style = node.style;
    const typography: TypographyStyles = {
      fontFamily: this.sanitizeFontFamily(style.fontFamily),
      fontSize: `${style.fontSize}px`,
      fontWeight: style.fontWeight,
      lineHeight: this.calculateLineHeight(style),
      letterSpacing: `${style.letterSpacing}px`,
      textAlign: this.mapTextAlign(style.textAlignHorizontal)
    };

    // Text decoration
    if (style.textDecoration && style.textDecoration !== 'NONE') {
      typography.textDecoration = style.textDecoration.toLowerCase();
    }

    // Text transform
    if (style.textCase && style.textCase !== 'ORIGINAL') {
      typography.textTransform = this.mapTextCase(style.textCase);
    }

    // White space handling
    if (style.textAutoResize === 'NONE') {
      typography.whiteSpace = 'nowrap';
    }

    return typography;
  }

  /**
   * Extract color styles
   */
  private extractColorStyles(node: FigmaNode): ColorStyles {
    const styles: ColorStyles = {};

    // Background color
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.visible !== false) {
        styles.backgroundColor = this.paintToCSS(fill);
      }
    }

    // Text color
    if (node.type === 'TEXT' && node.style?.fills && node.style.fills.length > 0) {
      const fill = node.style.fills[0];
      if (fill.visible !== false) {
        styles.color = this.paintToCSS(fill);
      }
    }

    // Border color
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.visible !== false) {
        styles.borderColor = this.paintToCSS(stroke);
      }
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity < 1) {
      styles.opacity = node.opacity;
    }

    return styles;
  }

  /**
   * Extract spacing styles
   */
  private extractSpacingStyles(node: FigmaNode): SpacingStyles {
    const styles: SpacingStyles = {};

    // Padding
    if (node.paddingLeft !== undefined || node.paddingRight !== undefined ||
        node.paddingTop !== undefined || node.paddingBottom !== undefined) {
      
      const top = node.paddingTop ?? 0;
      const right = node.paddingRight ?? 0;
      const bottom = node.paddingBottom ?? 0;
      const left = node.paddingLeft ?? 0;

      if (top === right && right === bottom && bottom === left) {
        styles.padding = `${top}px`;
      } else if (top === bottom && left === right) {
        styles.padding = `${top}px ${right}px`;
      } else {
        styles.paddingTop = `${top}px`;
        styles.paddingRight = `${right}px`;
        styles.paddingBottom = `${bottom}px`;
        styles.paddingLeft = `${left}px`;
      }
    }

    // Margin (derived from layout constraints)
    if (node.constraints && node.absoluteBoundingBox) {
      const margin = this.calculateMarginFromConstraints(node);
      if (margin) {
        Object.assign(styles, margin);
      }
    }

    return styles;
  }

  /**
   * Extract border styles
   */
  private extractBorderStyles(node: FigmaNode): BorderStyles {
    const styles: BorderStyles = {};

    // Border width and style
    if (node.strokeWeight !== undefined && node.strokeWeight > 0) {
      styles.borderWidth = `${node.strokeWeight}px`;
      styles.borderStyle = 'solid';
    }

    // Border radius
    if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
      styles.borderRadius = `${node.cornerRadius}px`;
    }

    // Individual corner radii
    if (node.rectangleCornerRadii) {
      const [topLeft, topRight, bottomRight, bottomLeft] = node.rectangleCornerRadii;
      if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
        styles.borderRadius = `${topLeft}px`;
      } else {
        styles.borderRadius = `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
      }
    }

    // Stroke alignment
    if (node.strokeAlign && node.strokeWeight) {
      // Note: CSS doesn't have exact equivalents, so we approximate
      if (node.strokeAlign === 'OUTSIDE') {
        // Could use box-shadow for outside borders
        styles.boxShadow = `0 0 0 ${node.strokeWeight}px ${this.getStrokeColor(node)}`;
        styles.borderWidth = '0';
      } else if (node.strokeAlign === 'INSIDE') {
        // Default behavior in CSS
      }
    }

    return styles;
  }

  /**
   * Extract shadow styles
   */
  private extractShadowStyles(node: FigmaNode): ShadowStyles {
    const styles: ShadowStyles = {};

    if (node.effects && node.effects.length > 0) {
      const shadows = node.effects
        .filter(effect => effect.type === 'DROP_SHADOW' && effect.visible !== false)
        .map(effect => this.effectToBoxShadow(effect))
        .filter(Boolean);

      if (shadows.length > 0) {
        styles.boxShadow = shadows.join(', ');
      }

      // Inner shadows
      const innerShadows = node.effects
        .filter(effect => effect.type === 'INNER_SHADOW' && effect.visible !== false)
        .map(effect => this.effectToBoxShadow(effect, true))
        .filter(Boolean);

      if (innerShadows.length > 0) {
        styles.boxShadow = (styles.boxShadow ? styles.boxShadow + ', ' : '') + innerShadows.join(', ');
      }
    }

    return styles;
  }

  /**
   * Extract effect styles (filters, transforms, etc.)
   */
  private extractEffectStyles(node: FigmaNode): EffectStyles {
    const styles: EffectStyles = {};

    if (node.effects && node.effects.length > 0) {
      const filters: string[] = [];

      node.effects.forEach(effect => {
        if (effect.visible === false) return;

        switch (effect.type) {
          case 'LAYER_BLUR':
            filters.push(`blur(${effect.radius}px)`);
            break;
          case 'BACKGROUND_BLUR':
            styles.backdropFilter = `blur(${effect.radius}px)`;
            break;
        }
      });

      if (filters.length > 0) {
        styles.filter = filters.join(' ');
      }
    }

    // Transform (rotation, scale)
    if (node.relativeTransform) {
      const transform = this.transformMatrixToCSS(node.relativeTransform);
      if (transform) {
        styles.transform = transform;
      }
    }

    // Blend mode
    if (node.blendMode && node.blendMode !== 'NORMAL') {
      styles.mixBlendMode = this.mapBlendMode(node.blendMode);
    }

    return styles;
  }

  /**
   * Extract responsive styles (placeholder)
   */
  private extractResponsiveStyles(node: FigmaNode): ResponsiveStyles | undefined {
    // This would be implemented based on Figma's responsive design features
    // For now, return undefined
    return undefined;
  }

  // Helper methods

  private getDisplayType(node: FigmaNode): string {
    if (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL') {
      return 'flex';
    }
    
    if (node.type === 'TEXT') {
      return 'inline-block';
    }

    return 'block';
  }

  private mapPrimaryAxisAlignment(alignment: string): string {
    switch (alignment) {
      case 'MIN': return 'flex-start';
      case 'CENTER': return 'center';
      case 'MAX': return 'flex-end';
      case 'SPACE_BETWEEN': return 'space-between';
      default: return 'flex-start';
    }
  }

  private mapCounterAxisAlignment(alignment: string): string {
    switch (alignment) {
      case 'MIN': return 'flex-start';
      case 'CENTER': return 'center';
      case 'MAX': return 'flex-end';
      case 'BASELINE': return 'baseline';
      default: return 'flex-start';
    }
  }

  private mapOverflowDirection(direction: string): string {
    switch (direction) {
      case 'HORIZONTAL_SCROLLING': return 'overflow-x: auto';
      case 'VERTICAL_SCROLLING': return 'overflow-y: auto';
      case 'HORIZONTAL_AND_VERTICAL_SCROLLING': return 'auto';
      default: return 'visible';
    }
  }

  private mapTextAlign(align?: string): string {
    if (!align) return 'left';
    switch (align) {
      case 'LEFT': return 'left';
      case 'RIGHT': return 'right';
      case 'CENTER': return 'center';
      case 'JUSTIFIED': return 'justify';
      default: return 'left';
    }
  }

  private mapTextCase(textCase: string): string {
    switch (textCase) {
      case 'UPPER': return 'uppercase';
      case 'LOWER': return 'lowercase';
      case 'TITLE': return 'capitalize';
      case 'SMALL_CAPS': return 'small-caps';
      default: return 'none';
    }
  }

  private mapBlendMode(blendMode: string): string {
    switch (blendMode) {
      case 'MULTIPLY': return 'multiply';
      case 'SCREEN': return 'screen';
      case 'OVERLAY': return 'overlay';
      case 'DARKEN': return 'darken';
      case 'LIGHTEN': return 'lighten';
      case 'COLOR_DODGE': return 'color-dodge';
      case 'COLOR_BURN': return 'color-burn';
      case 'HARD_LIGHT': return 'hard-light';
      case 'SOFT_LIGHT': return 'soft-light';
      case 'DIFFERENCE': return 'difference';
      case 'EXCLUSION': return 'exclusion';
      case 'HUE': return 'hue';
      case 'SATURATION': return 'saturation';
      case 'COLOR': return 'color';
      case 'LUMINOSITY': return 'luminosity';
      default: return 'normal';
    }
  }

  private sanitizeFontFamily(fontFamily: string): string {
    // Common font mappings
    const fontMappings: Record<string, string> = {
      'Inter': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'Roboto': 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'Helvetica': 'Helvetica, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'Arial': 'Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'SF Pro Display': '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      'SF Pro Text': '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
    };

    return fontMappings[fontFamily] || `"${fontFamily}", sans-serif`;
  }

  private calculateLineHeight(style: TypeStyle): number {
    if (style.lineHeightPercent) {
      return style.lineHeightPercent / 100;
    }
    if (style.lineHeightPx && style.fontSize) {
      return style.lineHeightPx / style.fontSize;
    }
    return 1.2; // Default line height
  }

  private paintToCSS(paint: Paint): string {
    if (paint.type === 'SOLID' && paint.color) {
      return this.colorToCSS(paint.color, paint.opacity);
    }
    
    if (paint.type === 'GRADIENT_LINEAR' && paint.gradientStops) {
      return this.gradientToCSS(paint);
    }

    return 'transparent';
  }

  private colorToCSS(color: Color, opacity?: number): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = opacity !== undefined ? opacity : color.a;

    if (a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  private gradientToCSS(paint: Paint): string {
    if (!paint.gradientStops) return 'transparent';

    const stops = paint.gradientStops.map(stop => {
      const color = this.colorToCSS(stop.color);
      const position = Math.round(stop.position * 100);
      return `${color} ${position}%`;
    }).join(', ');

    switch (paint.type) {
      case 'GRADIENT_LINEAR':
        return `linear-gradient(90deg, ${stops})`;
      case 'GRADIENT_RADIAL':
        return `radial-gradient(circle, ${stops})`;
      default:
        return `linear-gradient(90deg, ${stops})`;
    }
  }

  private getStrokeColor(node: FigmaNode): string {
    if (node.strokes && node.strokes.length > 0) {
      return this.paintToCSS(node.strokes[0]);
    }
    return 'currentColor';
  }

  private effectToBoxShadow(effect: Effect, inset: boolean = false): string | null {
    if (!effect.color || !effect.offset) return null;

    const color = this.colorToCSS(effect.color);
    const x = effect.offset.x || 0;
    const y = effect.offset.y || 0;
    const blur = effect.radius || 0;
    const spread = effect.spread || 0;
    const insetKeyword = inset ? 'inset ' : '';

    return `${insetKeyword}${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }

  private transformMatrixToCSS(matrix: any): string | null {
    // Convert Figma transform matrix to CSS transform
    // This is a simplified implementation
    const { m00, m01, m02, m10, m11, m12 } = matrix;
    
    // Check for rotation
    const rotation = Math.atan2(m10, m00) * (180 / Math.PI);
    if (Math.abs(rotation) > 0.1) {
      return `rotate(${rotation.toFixed(2)}deg)`;
    }

    // Check for scale
    const scaleX = Math.sqrt(m00 * m00 + m10 * m10);
    const scaleY = Math.sqrt(m01 * m01 + m11 * m11);
    if (Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01) {
      return `scale(${scaleX.toFixed(2)}, ${scaleY.toFixed(2)})`;
    }

    // Check for translation
    if (Math.abs(m02) > 0.1 || Math.abs(m12) > 0.1) {
      return `translate(${m02.toFixed(2)}px, ${m12.toFixed(2)}px)`;
    }

    return null;
  }

  private calculateMarginFromConstraints(node: FigmaNode): SpacingStyles | null {
    // This would calculate margins based on Figma's constraint system
    // For now, return null as it's complex to implement accurately
    return null;
  }
}