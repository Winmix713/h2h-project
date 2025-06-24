import path from 'path';
import { 
  ParsedComponent, 
  GeneratorConfig, 
  ComponentCategory,
  ComponentType,
  GeneratedComponent 
} from '../types/generator';

export class FileOrganizer {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  /**
   * Get file path for a component
   */
  getComponentPath(component: ParsedComponent, fileName: string): string {
    const baseDir = this.config.outputDir;
    const categoryDir = this.getCategoryDirectory(component.category);
    const extension = this.getFileExtension('component');
    
    return path.join(baseDir, categoryDir, `${fileName}${extension}`);
  }

  /**
   * Get file path for component styles
   */
  getStylesPath(component: ParsedComponent, fileName: string): string {
    const baseDir = this.config.outputDir;
    const categoryDir = this.getCategoryDirectory(component.category);
    const extension = this.getFileExtension('styles');
    
    return path.join(baseDir, categoryDir, `${fileName}.styles${extension}`);
  }

  /**
   * Get file path for component types
   */
  getTypesPath(component: ParsedComponent, fileName: string): string {
    const baseDir = this.config.outputDir;
    const categoryDir = this.getCategoryDirectory(component.category);
    
    return path.join(baseDir, categoryDir, `${fileName}.types.ts`);
  }

  /**
   * Get file path for component stories
   */
  getStoriesPath(component: ParsedComponent, fileName: string): string {
    const baseDir = this.config.outputDir;
    const categoryDir = this.getCategoryDirectory(component.category);
    
    return path.join(baseDir, categoryDir, `${fileName}.stories.tsx`);
  }

  /**
   * Get file path for component tests
   */
  getTestsPath(component: ParsedComponent, fileName: string): string {
    const baseDir = this.config.outputDir;
    const categoryDir = this.getCategoryDirectory(component.category);
    const extension = this.config.useTypeScript ? '.test.tsx' : '.test.jsx';
    
    return path.join(baseDir, categoryDir, `${fileName}${extension}`);
  }

  /**
   * Get file path for index file
   */
  getIndexPath(category?: ComponentCategory): string {
    const baseDir = this.config.outputDir;
    const extension = this.config.useTypeScript ? '.ts' : '.js';
    
    if (category) {
      const categoryDir = this.getCategoryDirectory(category);
      return path.join(baseDir, categoryDir, `index${extension}`);
    }
    
    return path.join(baseDir, `index${extension}`);
  }

  /**
   * Get file path for theme files
   */
  getThemePath(fileName: string): string {
    const baseDir = this.config.outputDir;
    const extension = this.getFileExtension('theme');
    
    return path.join(baseDir, 'theme', `${fileName}${extension}`);
  }

  /**
   * Get file path for utility files
   */
  getUtilsPath(fileName: string): string {
    const baseDir = this.config.outputDir;
    const extension = this.config.useTypeScript ? '.ts' : '.js';
    
    return path.join(baseDir, 'utils', `${fileName}${extension}`);
  }

  /**
   * Get file path for hook files
   */
  getHooksPath(fileName: string): string {
    const baseDir = this.config.outputDir;
    const extension = this.config.useTypeScript ? '.ts' : '.js';
    
    return path.join(baseDir, 'hooks', `${fileName}${extension}`);
  }

  /**
   * Get file path for context files
   */
  getContextPath(fileName: string): string {
    const baseDir = this.config.outputDir;
    const extension = this.config.useTypeScript ? '.tsx' : '.jsx';
    
    return path.join(baseDir, 'contexts', `${fileName}${extension}`);
  }

  /**
   * Get file path for asset files
   */
  getAssetsPath(fileName: string, subDir?: string): string {
    const baseDir = this.config.outputDir;
    const assetsDir = subDir ? path.join('assets', subDir) : 'assets';
    
    return path.join(baseDir, assetsDir, fileName);
  }

  /**
   * Get relative import path between two files
   */
  getRelativeImportPath(fromPath: string, toPath: string): string {
    const relativePath = path.relative(path.dirname(fromPath), toPath);
    
    // Remove file extension for imports
    const withoutExtension = relativePath.replace(/\.(ts|tsx|js|jsx)$/, '');
    
    // Ensure it starts with ./ or ../
    if (!withoutExtension.startsWith('.')) {
      return `./${withoutExtension}`;
    }
    
    return withoutExtension;
  }

  /**
   * Organize components by file structure preference
   */
  organizeByStructure(components: GeneratedComponent[]): Record<string, GeneratedComponent[]> {
    const structure = this.config.plugins?.find(p => p.name === 'file-structure')?.options?.type || 'category';
    
    switch (structure) {
      case 'category':
        return this.organizeByCategory(components);
      case 'type':
        return this.organizeByType(components);
      case 'alphabetical':
        return this.organizeAlphabetically(components);
      case 'flat':
        return { 'components': components };
      default:
        return this.organizeByCategory(components);
    }
  }

  /**
   * Generate directory structure
   */
  generateDirectoryStructure(): string[] {
    const directories: string[] = [];
    const baseDir = this.config.outputDir;
    
    // Add base directory
    directories.push(baseDir);
    
    // Add category directories
    const categories = this.getAllCategories();
    categories.forEach(category => {
      const categoryDir = this.getCategoryDirectory(category);
      directories.push(path.join(baseDir, categoryDir));
    });
    
    // Add theme directory
    directories.push(path.join(baseDir, 'theme'));
    
    // Add utils directory
    directories.push(path.join(baseDir, 'utils'));
    
    // Add hooks directory if needed
    if (this.config.plugins?.some(p => p.name === 'hooks')) {
      directories.push(path.join(baseDir, 'hooks'));
    }
    
    // Add contexts directory if needed
    if (this.config.plugins?.some(p => p.name === 'contexts')) {
      directories.push(path.join(baseDir, 'contexts'));
    }
    
    // Add assets directory
    directories.push(path.join(baseDir, 'assets'));
    directories.push(path.join(baseDir, 'assets', 'images'));
    directories.push(path.join(baseDir, 'assets', 'icons'));
    directories.push(path.join(baseDir, 'assets', 'fonts'));
    
    return directories;
  }

  /**
   * Generate file manifest
   */
  generateFileManifest(components: GeneratedComponent[]): Record<string, string[]> {
    const manifest: Record<string, string[]> = {};
    
    components.forEach(component => {
      const categoryDir = this.getCategoryDirectory(component.category);
      if (!manifest[categoryDir]) {
        manifest[categoryDir] = [];
      }
      manifest[categoryDir].push(component.path);
    });
    
    return manifest;
  }

  // Private helper methods

  private getCategoryDirectory(category: ComponentCategory): string {
    const categoryMap: Record<ComponentCategory, string> = {
      'container': 'layout',
      'button': 'buttons',
      'input': 'forms',
      'textarea': 'forms',
      'select': 'forms',
      'checkbox': 'forms',
      'radio': 'forms',
      'datepicker': 'forms',
      'form': 'forms',
      'card': 'display',
      'modal': 'overlays',
      'tooltip': 'overlays',
      'header': 'navigation',
      'footer': 'navigation',
      'sidebar': 'navigation',
      'navigation': 'navigation',
      'list': 'display',
      'table': 'display',
      'icon': 'media',
      'image': 'media',
      'text': 'typography',
      'link': 'typography',
      'badge': 'display',
      'alert': 'feedback',
      'loader': 'feedback',
      'progress': 'feedback',
      'slider': 'controls',
      'toggle': 'controls',
      'tabs': 'navigation',
      'accordion': 'display',
      'carousel': 'display',
      'chart': 'visualization',
      'map': 'visualization',
      'video': 'media',
      'audio': 'media',
      'other': 'misc'
    };
    
    return categoryMap[category] || 'misc';
  }

  private getFileExtension(type: 'component' | 'styles' | 'theme'): string {
    const isTypeScript = this.config.useTypeScript;
    const hasJSX = type === 'component';
    
    if (type === 'styles') {
      switch (this.config.styleApproach) {
        case 'styled-components':
        case 'emotion':
          return isTypeScript ? '.ts' : '.js';
        case 'css-modules':
          return '.module.css';
        case 'tailwind':
          return ''; // No separate style file
        case 'inline':
          return ''; // No separate style file
        default:
          return '.css';
      }
    }
    
    if (hasJSX) {
      return isTypeScript ? '.tsx' : '.jsx';
    }
    
    return isTypeScript ? '.ts' : '.js';
  }

  private organizeByCategory(components: GeneratedComponent[]): Record<string, GeneratedComponent[]> {
    return components.reduce((acc, component) => {
      const category = component.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(component);
      return acc;
    }, {} as Record<string, GeneratedComponent[]>);
  }

  private organizeByType(components: GeneratedComponent[]): Record<string, GeneratedComponent[]> {
    return components.reduce((acc, component) => {
      const type = component.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(component);
      return acc;
    }, {} as Record<string, GeneratedComponent[]>);
  }

  private organizeAlphabetically(components: GeneratedComponent[]): Record<string, GeneratedComponent[]> {
    const sorted = components.sort((a, b) => a.name.localeCompare(b.name));
    return { 'components': sorted };
  }

  private getAllCategories(): ComponentCategory[] {
    return [
      'container', 'button', 'input', 'textarea', 'select', 'checkbox', 'radio',
      'datepicker', 'form', 'card', 'modal', 'tooltip', 'header', 'footer',
      'sidebar', 'navigation', 'list', 'table', 'icon', 'image', 'text', 'link',
      'badge', 'alert', 'loader', 'progress', 'slider', 'toggle', 'tabs',
      'accordion', 'carousel', 'chart', 'map', 'video', 'audio', 'other'
    ];
  }

  /**
   * Validate file path
   */
  validatePath(filePath: string): boolean {
    // Check for invalid characters
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(filePath)) {
      return false;
    }
    
    // Check path length (Windows has 260 char limit)
    if (filePath.length > 250) {
      return false;
    }
    
    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    const fileName = path.basename(filePath, path.extname(filePath));
    if (reservedNames.includes(fileName.toUpperCase())) {
      return false;
    }
    
    return true;
  }

  /**
   * Ensure unique file path
   */
  ensureUniquePath(basePath: string, existingPaths: string[]): string {
    let uniquePath = basePath;
    let counter = 1;
    
    while (existingPaths.includes(uniquePath)) {
      const ext = path.extname(basePath);
      const nameWithoutExt = path.basename(basePath, ext);
      const dir = path.dirname(basePath);
      uniquePath = path.join(dir, `${nameWithoutExt}-${counter}${ext}`);
      counter++;
    }
    
    return uniquePath;
  }

  /**
   * Clean file path
   */
  cleanPath(filePath: string): string {
    return filePath
      .replace(/[<>:"|?*]/g, '') // Remove invalid characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/--+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
  }
}