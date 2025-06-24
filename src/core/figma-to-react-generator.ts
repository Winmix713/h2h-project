import { FigmaApiClient } from '../api/figma-client';
import { DesignParser } from '../parsers/design-parser';
import { CoreGenerator } from '../generators/core-generator';
import { 
  GeneratorConfig, 
  GenerationResult, 
  ParsedDesign,
  StyleApproach,
  Framework,
  NamingConvention
} from '../types/generator';
import fs from 'fs-extra';
import path from 'path';

export class FigmaToReactGenerator {
  private config: GeneratorConfig;
  private figmaClient: FigmaApiClient;
  private designParser: DesignParser;
  private coreGenerator: CoreGenerator;

  constructor(config: Partial<GeneratorConfig> = {}) {
    this.config = this.mergeWithDefaults(config);
    this.figmaClient = new FigmaApiClient(this.config.figmaToken);
    this.designParser = new DesignParser();
    this.coreGenerator = new CoreGenerator(this.config);
  }

  /**
   * Generate React components from Figma file
   */
  async generateFromFile(fileKey: string): Promise<GenerationResult> {
    try {
      console.log(`🚀 Starting generation for Figma file: ${fileKey}`);

      // Validate token
      const isValidToken = await this.figmaClient.validateToken();
      if (!isValidToken) {
        throw new Error('Invalid Figma token. Please check your token and try again.');
      }

      // Fetch Figma file
      console.log('📥 Fetching Figma file...');
      const figmaFile = await this.figmaClient.getFile(fileKey);

      // Parse design
      console.log('🔍 Parsing design structure...');
      const parsedDesign = await this.designParser.parseDesign(figmaFile, fileKey);

      // Generate code
      console.log('⚡ Generating React components...');
      const result = await this.coreGenerator.generateCode(parsedDesign);

      // Write files
      if (result.success) {
        console.log('💾 Writing generated files...');
        await this.writeGeneratedFiles(result);
        console.log(`✅ Generation completed successfully! Generated ${result.components.length} components.`);
      }

      return result;

    } catch (error) {
      console.error('💥 Generation failed:', error);
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
            generationTime: 0
          }
        },
        errors: [{
          type: 'generation',
          message: (error as Error).message,
          stack: (error as Error).stack
        }]
      };
    }
  }

  /**
   * Generate from Figma URL
   */
  async generateFromUrl(figmaUrl: string): Promise<GenerationResult> {
    const fileKey = FigmaApiClient.extractFileKey(figmaUrl);
    if (!fileKey) {
      throw new Error('Invalid Figma URL. Please provide a valid Figma file URL.');
    }
    return this.generateFromFile(fileKey);
  }

  /**
   * Generate from specific nodes
   */
  async generateFromNodes(fileKey: string, nodeIds: string[]): Promise<GenerationResult> {
    try {
      console.log(`🚀 Starting generation for specific nodes: ${nodeIds.join(', ')}`);

      // Fetch specific nodes
      const nodesResponse = await this.figmaClient.getFileNodes(fileKey, nodeIds);
      
      // Create a minimal file structure for parsing
      const figmaFile = {
        document: {
          id: 'document',
          name: 'Document',
          type: 'DOCUMENT' as const,
          children: Object.values(nodesResponse.nodes)
        },
        components: {},
        schemaVersion: 0,
        styles: {},
        name: nodesResponse.name,
        lastModified: nodesResponse.lastModified,
        thumbnailUrl: nodesResponse.thumbnailUrl,
        version: nodesResponse.version,
        role: 'viewer',
        editorType: 'figma',
        linkAccess: 'view'
      };

      // Parse and generate
      const parsedDesign = await this.designParser.parseDesign(figmaFile, fileKey);
      const result = await this.coreGenerator.generateCode(parsedDesign);

      if (result.success) {
        await this.writeGeneratedFiles(result);
        console.log(`✅ Generation completed! Generated ${result.components.length} components.`);
      }

      return result;

    } catch (error) {
      console.error('💥 Node generation failed:', error);
      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.figmaClient = new FigmaApiClient(this.config.figmaToken);
    this.coreGenerator = new CoreGenerator(this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): GeneratorConfig {
    return { ...this.config };
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.figmaToken) {
      errors.push('Figma token is required');
    }

    if (!this.config.outputDir) {
      errors.push('Output directory is required');
    }

    if (!['styled-components', 'css-modules', 'tailwind', 'inline'].includes(this.config.styleApproach)) {
      errors.push('Invalid style approach');
    }

    if (!['react', 'vue', 'angular', 'svelte'].includes(this.config.framework)) {
      errors.push('Invalid framework');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Preview generation (dry run)
   */
  async previewGeneration(fileKey: string): Promise<{
    componentCount: number;
    components: Array<{ name: string; type: string; category: string }>;
    estimatedFiles: number;
  }> {
    const figmaFile = await this.figmaClient.getFile(fileKey);
    const parsedDesign = await this.designParser.parseDesign(figmaFile, fileKey);

    return {
      componentCount: parsedDesign.components.length,
      components: parsedDesign.components.map(comp => ({
        name: comp.name,
        type: comp.type,
        category: comp.category
      })),
      estimatedFiles: parsedDesign.components.length * 2 // Component + styles
    };
  }

  /**
   * Get available Figma pages
   */
  async getPages(fileKey: string): Promise<Array<{ id: string; name: string }>> {
    const pages = await this.figmaClient.getPages(fileKey);
    return pages.map(page => ({ id: page.id, name: page.name }));
  }

  /**
   * Get available Figma components
   */
  async getComponents(fileKey: string): Promise<Array<{ id: string; name: string; description?: string }>> {
    const components = await this.figmaClient.getComponents(fileKey);
    return components.map(comp => ({ 
      id: comp.id, 
      name: comp.name, 
      description: comp.name 
    }));
  }

  // Private methods

  private mergeWithDefaults(config: Partial<GeneratorConfig>): GeneratorConfig {
    return {
      figmaToken: config.figmaToken || process.env.FIGMA_TOKEN || '',
      styleApproach: config.styleApproach || 'styled-components',
      useTypeScript: config.useTypeScript ?? true,
      outputDir: config.outputDir || './src/components',
      responsive: config.responsive ?? true,
      accessibility: config.accessibility ?? true,
      componentNaming: config.componentNaming || 'PascalCase',
      fileNaming: config.fileNaming || 'kebab-case',
      framework: config.framework || 'react',
      cssFramework: config.cssFramework,
      theme: config.theme,
      breakpoints: config.breakpoints || {
        xs: '320px',
        sm: '768px',
        md: '1024px',
        lg: '1280px',
        xl: '1920px'
      },
      customMappings: config.customMappings,
      plugins: config.plugins || []
    };
  }

  private async writeGeneratedFiles(result: GenerationResult): Promise<void> {
    // Ensure output directory exists
    await fs.ensureDir(this.config.outputDir);

    // Write components
    for (const component of result.components) {
      await fs.ensureDir(path.dirname(component.path));
      await fs.writeFile(component.path, component.content);
    }

    // Write styles
    for (const stylesheet of result.styles) {
      await fs.ensureDir(path.dirname(stylesheet.path));
      await fs.writeFile(stylesheet.path, stylesheet.content);
    }

    // Write types
    if (result.types) {
      for (const typeFile of result.types) {
        await fs.ensureDir(path.dirname(typeFile.path));
        await fs.writeFile(typeFile.path, typeFile.content);
      }
    }

    // Write assets (would be downloaded and processed)
    for (const asset of result.assets) {
      await fs.ensureDir(path.dirname(asset.path));
      // In a real implementation, download and write the asset file
      console.log(`📁 Asset placeholder: ${asset.path}`);
    }

    // Write generation metadata
    const metadataPath = path.join(this.config.outputDir, 'generation-metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(result.metadata, null, 2));
  }

  /**
   * Static method to create generator with environment config
   */
  static fromEnvironment(): FigmaToReactGenerator {
    return new FigmaToReactGenerator({
      figmaToken: process.env.FIGMA_TOKEN,
      styleApproach: (process.env.STYLE_APPROACH as StyleApproach) || 'styled-components',
      useTypeScript: process.env.USE_TYPESCRIPT === 'true',
      outputDir: process.env.OUTPUT_DIR || './src/components',
      responsive: process.env.RESPONSIVE !== 'false',
      accessibility: process.env.ACCESSIBILITY !== 'false',
      framework: (process.env.FRAMEWORK as Framework) || 'react',
      componentNaming: (process.env.COMPONENT_NAMING as NamingConvention) || 'PascalCase',
      fileNaming: (process.env.FILE_NAMING as NamingConvention) || 'kebab-case'
    });
  }

  /**
   * Static method to create generator from config file
   */
  static async fromConfigFile(configPath: string): Promise<FigmaToReactGenerator> {
    try {
      const configFile = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configFile);
      return new FigmaToReactGenerator(config);
    } catch (error) {
      throw new Error(`Failed to load config file: ${(error as Error).message}`);
    }
  }
}