import { FigmaNode } from './figma';

// Generator Configuration
export interface GeneratorConfig {
  figmaToken: string;
  styleApproach: StyleApproach;
  useTypeScript: boolean;
  outputDir: string;
  responsive: boolean;
  accessibility: boolean;
  componentNaming: NamingConvention;
  fileNaming: NamingConvention;
  framework: Framework;
  cssFramework?: CSSFramework;
  theme?: ThemeConfig;
  breakpoints?: BreakpointConfig;
  customMappings?: NodeMappingConfig;
  plugins?: PluginConfig[];
}

export type StyleApproach = 'styled-components' | 'css-modules' | 'tailwind' | 'inline' | 'emotion' | 'stitches';
export type NamingConvention = 'PascalCase' | 'camelCase' | 'kebab-case' | 'snake_case';
export type Framework = 'react' | 'vue' | 'angular' | 'svelte' | 'solid';
export type CSSFramework = 'tailwind' | 'bootstrap' | 'bulma' | 'chakra' | 'material-ui' | 'ant-design';

export interface ThemeConfig {
  colors?: Record<string, string>;
  typography?: TypographyConfig;
  spacing?: Record<string, string>;
  shadows?: Record<string, string>;
  borders?: Record<string, string>;
  radii?: Record<string, string>;
}

export interface TypographyConfig {
  fonts?: Record<string, string>;
  fontSizes?: Record<string, string>;
  fontWeights?: Record<string, number>;
  lineHeights?: Record<string, number>;
  letterSpacings?: Record<string, string>;
}

export interface BreakpointConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl?: string;
}

export interface NodeMappingConfig {
  [key: string]: ComponentMapping;
}

export interface ComponentMapping {
  element: string;
  component?: string;
  props?: Record<string, any>;
  wrapperProps?: Record<string, any>;
  customHandler?: string;
}

export interface PluginConfig {
  name: string;
  options?: Record<string, any>;
}

// Parsed Design Structure
export interface ParsedDesign {
  name: string;
  components: ParsedComponent[];
  pages: ParsedPage[];
  styles: ParsedStyleSystem;
  assets: ParsedAsset[];
  metadata: DesignMetadata;
}

export interface ParsedComponent {
  id: string;
  name: string;
  type: ComponentType;
  description?: string;
  variants?: ComponentVariant[];
  props: ComponentProp[];
  children: ParsedElement[];
  styles: ComputedStyles;
  responsive?: ResponsiveConfig;
  accessibility?: AccessibilityConfig;
  reusable: boolean;
  category: ComponentCategory;
}

export interface ParsedPage {
  id: string;
  name: string;
  components: ParsedComponent[];
  layout: LayoutConfig;
}

export interface ParsedElement {
  id: string;
  name: string;
  type: ElementType;
  tagName: string;
  content?: string;
  children: ParsedElement[];
  styles: ComputedStyles;
  props: ElementProp[];
  events?: EventHandler[];
  accessibility?: AccessibilityConfig;
  position: PositionConfig;
  constraints?: ConstraintConfig;
}

export interface ParsedStyleSystem {
  colors: ColorSystem;
  typography: TypographySystem;
  spacing: SpacingSystem;
  shadows: ShadowSystem;
  borders: BorderSystem;
  effects: EffectSystem;
}

export interface ParsedAsset {
  id: string;
  name: string;
  type: AssetType;
  url: string;
  format: string;
  size?: { width: number; height: number };
  optimized?: boolean;
}

export interface DesignMetadata {
  fileKey: string;
  fileName: string;
  version: string;
  lastModified: string;
  figmaUrl: string;
  exportTime: string;
  generator: string;
}

// Component Types
export type ComponentType = 
  | 'layout' 
  | 'ui' 
  | 'typography' 
  | 'media' 
  | 'interactive' 
  | 'navigation' 
  | 'data-display' 
  | 'feedback' 
  | 'form';

export type ComponentCategory = 
  | 'container' 
  | 'button' 
  | 'input' 
  | 'card' 
  | 'modal' 
  | 'header' 
  | 'footer' 
  | 'sidebar' 
  | 'navigation' 
  | 'list' 
  | 'table' 
  | 'form' 
  | 'icon' 
  | 'image' 
  | 'text' 
  | 'link' 
  | 'badge' 
  | 'tooltip' 
  | 'alert' 
  | 'loader' 
  | 'progress' 
  | 'slider' 
  | 'toggle' 
  | 'checkbox' 
  | 'radio' 
  | 'select' 
  | 'textarea' 
  | 'datepicker' 
  | 'tabs' 
  | 'accordion' 
  | 'carousel' 
  | 'chart' 
  | 'map' 
  | 'video' 
  | 'audio' 
  | 'other';

export type ElementType = 
  | 'container' 
  | 'text' 
  | 'image' 
  | 'icon' 
  | 'shape' 
  | 'button' 
  | 'input' 
  | 'link' 
  | 'list' 
  | 'table' 
  | 'form' 
  | 'media' 
  | 'interactive';

export type AssetType = 'image' | 'icon' | 'font' | 'video' | 'audio' | 'other';

export interface ComponentVariant {
  name: string;
  props: Record<string, any>;
  styles?: ComputedStyles;
}

export interface ComponentProp {
  name: string;
  type: PropType;
  defaultValue?: any;
  required: boolean;
  description?: string;
  options?: PropOption[];
}

export interface ElementProp {
  name: string;
  value: any;
  type: PropType;
}

export interface PropOption {
  label: string;
  value: any;
}

export type PropType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'array' 
  | 'object' 
  | 'function' 
  | 'enum' 
  | 'color' 
  | 'size' 
  | 'spacing' 
  | 'variant';

export interface EventHandler {
  type: EventType;
  handler: string;
  params?: Record<string, any>;
}

export type EventType = 
  | 'click' 
  | 'hover' 
  | 'focus' 
  | 'blur' 
  | 'change' 
  | 'submit' 
  | 'keydown' 
  | 'keyup' 
  | 'scroll' 
  | 'resize';

// Style System
export interface ComputedStyles {
  layout: LayoutStyles;
  typography?: TypographyStyles | undefined;
  colors: ColorStyles;
  spacing: SpacingStyles;
  borders: BorderStyles;
  shadows: ShadowStyles;
  effects: EffectStyles;
  responsive?: ResponsiveStyles | undefined;
}

export interface LayoutStyles {
  display: string;
  position?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  flexDirection?: string;
  alignItems?: string;
  justifyContent?: string;
  flexWrap?: string;
  gap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridGap?: string;
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  overflow?: string;
  zIndex?: number;
}

export interface TypographyStyles {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: string;
  textAlign: string;
  textDecoration?: string;
  textTransform?: string;
  whiteSpace?: string;
  wordBreak?: string;
}

export interface ColorStyles {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  opacity?: number;
}

export interface SpacingStyles {
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
}

export interface BorderStyles {
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderStyle?: string;
  boxShadow?: string;
}

export interface ShadowStyles {
  boxShadow?: string;
  textShadow?: string;
}

export interface EffectStyles {
  filter?: string;
  backdropFilter?: string;
  transform?: string;
  transformOrigin?: string;
  transition?: string;
  animation?: string;
  mixBlendMode?: string;
}

export interface ResponsiveStyles {
  [breakpoint: string]: Partial<ComputedStyles>;
}

// Configuration Interfaces
export interface LayoutConfig {
  type: 'fixed' | 'fluid' | 'responsive';
  maxWidth?: string;
  grid?: GridConfig;
  breakpoints?: BreakpointConfig;
}

export interface GridConfig {
  columns: number;
  gutter: string;
  margin: string;
}

export interface ResponsiveConfig {
  breakpoints: BreakpointConfig;
  behavior: ResponsiveBehavior;
}

export type ResponsiveBehavior = 'scale' | 'stack' | 'hide' | 'custom';

export interface AccessibilityConfig {
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  tabIndex?: number;
  focusable?: boolean;
  semanticElement?: string;
  alt?: string;
  title?: string;
}

export interface PositionConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export interface ConstraintConfig {
  horizontal: 'left' | 'right' | 'center' | 'left-right' | 'scale';
  vertical: 'top' | 'bottom' | 'center' | 'top-bottom' | 'scale';
}

// Style Systems
export interface ColorSystem {
  primary: ColorPalette;
  secondary: ColorPalette;
  neutral: ColorPalette;
  semantic: SemanticColors;
  custom: Record<string, string>;
}

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface TypographySystem {
  fontFamilies: Record<string, string>;
  fontSizes: Record<string, string>;
  fontWeights: Record<string, number>;
  lineHeights: Record<string, number>;
  letterSpacings: Record<string, string>;
  textStyles: Record<string, TypographyStyles>;
}

export interface SpacingSystem {
  scale: Record<string, string>;
  semantic: Record<string, string>;
}

export interface ShadowSystem {
  elevation: Record<string, string>;
  colored: Record<string, string>;
  inset: Record<string, string>;
}

export interface BorderSystem {
  widths: Record<string, string>;
  styles: Record<string, string>;
  radii: Record<string, string>;
}

export interface EffectSystem {
  blur: Record<string, string>;
  brightness: Record<string, string>;
  contrast: Record<string, string>;
  opacity: Record<string, number>;
}

// Generation Output
export interface GenerationResult {
  success: boolean;
  components: GeneratedComponent[];
  styles: GeneratedStylesheet[];
  assets: GeneratedAsset[];
  types?: GeneratedType[];
  metadata: GenerationMetadata;
  errors?: GenerationError[];
  warnings?: GenerationWarning[];
}

export interface GeneratedComponent {
  name: string;
  path: string;
  content: string;
  dependencies: string[];
  exports: string[];
  type: ComponentType;
  category: ComponentCategory;
  props: ComponentProp[];
  stories?: string;
  tests?: string;
}

export interface GeneratedStylesheet {
  name: string;
  path: string;
  content: string;
  type: 'css' | 'scss' | 'less' | 'styled' | 'emotion';
  variables?: Record<string, string>;
  mixins?: string[];
}

export interface GeneratedAsset {
  name: string;
  path: string;
  originalUrl: string;
  format: string;
  optimized: boolean;
  size: { width: number; height: number };
}

export interface GeneratedType {
  name: string;
  path: string;
  content: string;
  interfaces: string[];
  types: string[];
  enums: string[];
}

export interface GenerationMetadata {
  timestamp: string;
  version: string;
  config: GeneratorConfig;
  stats: GenerationStats;
}

export interface GenerationStats {
  totalComponents: number;
  componentsByType: Record<ComponentType, number>;
  totalStyles: number;
  totalAssets: number;
  totalLines: number;
  generationTime: number;
}

export interface GenerationError {
  type: 'parsing' | 'generation' | 'validation' | 'io';
  message: string;
  node?: FigmaNode;
  stack?: string;
}

export interface GenerationWarning {
  type: 'style' | 'accessibility' | 'performance' | 'best-practice';
  message: string;
  node?: FigmaNode;
  suggestion?: string;
}