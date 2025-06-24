import { 
  ParsedAsset, 
  GeneratorConfig, 
  GeneratedAsset,
  AssetType
} from '../types/generator';
import fs from 'fs-extra';
import path from 'path';

export class AssetGenerator {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  /**
   * Generate and optimize assets
   */
  async generateAssets(assets: ParsedAsset[]): Promise<GeneratedAsset[]> {
    const generatedAssets: GeneratedAsset[] = [];

    for (const asset of assets) {
      try {
        const generatedAsset = await this.processAsset(asset);
        if (generatedAsset) {
          generatedAssets.push(generatedAsset);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to process asset ${asset.name}:`, error);
      }
    }

    return generatedAssets;
  }

  private async processAsset(asset: ParsedAsset): Promise<GeneratedAsset | null> {
    switch (asset.type) {
      case 'image':
        return this.processImage(asset);
      case 'icon':
        return this.processIcon(asset);
      case 'font':
        return this.processFont(asset);
      default:
        return this.processGenericAsset(asset);
    }
  }

  private async processImage(asset: ParsedAsset): Promise<GeneratedAsset> {
    const optimizedPath = this.getAssetPath(asset, 'images');
    const optimizedName = this.generateOptimizedName(asset);

    // For now, we'll just return the asset info
    // In a real implementation, you'd download and optimize the image
    return {
      name: optimizedName,
      path: optimizedPath,
      originalUrl: asset.url,
      format: this.getOptimalImageFormat(asset),
      optimized: true,
      size: asset.size || { width: 0, height: 0 }
    };
  }

  private async processIcon(asset: ParsedAsset): Promise<GeneratedAsset> {
    const iconPath = this.getAssetPath(asset, 'icons');
    const iconName = this.generateIconName(asset);

    // For SVG icons, we might want to inline them or convert to React components
    if (asset.format === 'svg') {
      return this.processSVGIcon(asset, iconPath, iconName);
    }

    return {
      name: iconName,
      path: iconPath,
      originalUrl: asset.url,
      format: 'svg',
      optimized: true,
      size: asset.size || { width: 24, height: 24 }
    };
  }

  private async processSVGIcon(asset: ParsedAsset, iconPath: string, iconName: string): Promise<GeneratedAsset> {
    // Generate React component for SVG icon
    const componentPath = iconPath.replace('.svg', '.tsx');
    const componentContent = this.generateSVGComponent(asset, iconName);

    // Write component file (in a real implementation)
    // await fs.writeFile(componentPath, componentContent);

    return {
      name: iconName,
      path: componentPath,
      originalUrl: asset.url,
      format: 'tsx',
      optimized: true,
      size: asset.size || { width: 24, height: 24 }
    };
  }

  private async processFont(asset: ParsedAsset): Promise<GeneratedAsset> {
    const fontPath = this.getAssetPath(asset, 'fonts');
    const fontName = this.generateFontName(asset);

    return {
      name: fontName,
      path: fontPath,
      originalUrl: asset.url,
      format: this.getOptimalFontFormat(asset),
      optimized: true,
      size: { width: 0, height: 0 }
    };
  }

  private async processGenericAsset(asset: ParsedAsset): Promise<GeneratedAsset> {
    const assetPath = this.getAssetPath(asset, 'misc');

    return {
      name: asset.name,
      path: assetPath,
      originalUrl: asset.url,
      format: asset.format,
      optimized: false,
      size: asset.size || { width: 0, height: 0 }
    };
  }

  private getAssetPath(asset: ParsedAsset, subDir: string): string {
    const fileName = this.sanitizeFileName(asset.name);
    const extension = this.getAssetExtension(asset);
    return path.join(this.config.outputDir, 'assets', subDir, `${fileName}${extension}`);
  }

  private generateOptimizedName(asset: ParsedAsset): string {
    const baseName = this.sanitizeFileName(asset.name);
    const timestamp = Date.now().toString(36);
    return `${baseName}-${timestamp}`;
  }

  private generateIconName(asset: ParsedAsset): string {
    const baseName = this.sanitizeFileName(asset.name);
    const iconName = baseName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    return `${iconName}Icon`;
  }

  private generateFontName(asset: ParsedAsset): string {
    return this.sanitizeFileName(asset.name).replace(/\s+/g, '-').toLowerCase();
  }

  private generateSVGComponent(asset: ParsedAsset, componentName: string): string {
    const typescriptImport = this.config.useTypeScript ? "import React from 'react';\n\n" : '';
    const propsType = this.config.useTypeScript ? ': React.SVGProps<SVGSVGElement>' : '';
    
    return `${typescriptImport}export const ${componentName} = (props${propsType}) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* SVG content would be inserted here */}
    <path d="..." fill="currentColor" />
  </svg>
);

export default ${componentName};`;
  }

  private getOptimalImageFormat(asset: ParsedAsset): string {
    // Determine optimal format based on image characteristics
    if (asset.format === 'svg') return 'svg';
    
    // For photos, prefer WebP with JPEG fallback
    if (this.isPhoto(asset)) {
      return 'webp';
    }
    
    // For graphics/illustrations, prefer PNG
    return 'png';
  }

  private getOptimalFontFormat(asset: ParsedAsset): string {
    // Modern browsers support WOFF2
    return 'woff2';
  }

  private isPhoto(asset: ParsedAsset): boolean {
    // Simple heuristic to determine if asset is a photo
    const photoKeywords = ['photo', 'picture', 'image', 'jpg', 'jpeg'];
    return photoKeywords.some(keyword => 
      asset.name.toLowerCase().includes(keyword) || 
      asset.format.toLowerCase().includes(keyword)
    );
  }

  private getAssetExtension(asset: ParsedAsset): string {
    switch (asset.type) {
      case 'image':
        return `.${this.getOptimalImageFormat(asset)}`;
      case 'icon':
        return asset.format === 'svg' ? '.tsx' : '.svg';
      case 'font':
        return `.${this.getOptimalFontFormat(asset)}`;
      default:
        return `.${asset.format}`;
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }

  /**
   * Generate asset manifest file
   */
  generateAssetManifest(assets: GeneratedAsset[]): string {
    const manifest = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      assets: assets.reduce((acc, asset) => {
        acc[asset.name] = {
          path: asset.path,
          format: asset.format,
          optimized: asset.optimized,
          size: asset.size,
          originalUrl: asset.originalUrl
        };
        return acc;
      }, {} as Record<string, any>)
    };

    return JSON.stringify(manifest, null, 2);
  }

  /**
   * Generate CSS for font loading
   */
  generateFontCSS(fontAssets: GeneratedAsset[]): string {
    const fontFaces = fontAssets.map(asset => {
      const fontFamily = this.extractFontFamily(asset.name);
      const fontWeight = this.extractFontWeight(asset.name);
      const fontStyle = this.extractFontStyle(asset.name);

      return `@font-face {
  font-family: '${fontFamily}';
  src: url('${asset.path}') format('${this.getFontFormat(asset.format)}');
  font-weight: ${fontWeight};
  font-style: ${fontStyle};
  font-display: swap;
}`;
    }).join('\n\n');

    return fontFaces;
  }

  /**
   * Generate image optimization settings
   */
  generateImageOptimizationConfig(): any {
    return {
      formats: ['webp', 'avif', 'png', 'jpg'],
      quality: {
        webp: 80,
        avif: 80,
        png: 90,
        jpg: 80
      },
      sizes: [
        { width: 640, suffix: '-sm' },
        { width: 1024, suffix: '-md' },
        { width: 1920, suffix: '-lg' }
      ],
      optimization: {
        progressive: true,
        mozjpeg: true,
        pngquant: true,
        optipng: true,
        svgo: true
      }
    };
  }

  private extractFontFamily(fontName: string): string {
    return fontName.split('-')[0];
  }

  private extractFontWeight(fontName: string): string {
    if (fontName.includes('thin')) return '100';
    if (fontName.includes('light')) return '300';
    if (fontName.includes('regular') || fontName.includes('normal')) return '400';
    if (fontName.includes('medium')) return '500';
    if (fontName.includes('semibold')) return '600';
    if (fontName.includes('bold')) return '700';
    if (fontName.includes('extrabold')) return '800';
    if (fontName.includes('black')) return '900';
    return '400';
  }

  private extractFontStyle(fontName: string): string {
    return fontName.includes('italic') ? 'italic' : 'normal';
  }

  private getFontFormat(format: string): string {
    switch (format) {
      case 'woff2': return 'woff2';
      case 'woff': return 'woff';
      case 'ttf': return 'truetype';
      case 'otf': return 'opentype';
      default: return format;
    }
  }
}