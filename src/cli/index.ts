#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { FigmaToReactGenerator } from '../core/figma-to-react-generator';
import { FigmaApiClient } from '../api/figma-client';
import { GeneratorConfig, StyleApproach, Framework, NamingConvention } from '../types/generator';

const program = new Command();

program
  .name('figma-to-react')
  .description('Advanced Figma to React code generator')
  .version('1.0.0');

// Generate command
program
  .command('generate')
  .description('Generate React components from Figma file')
  .option('-f, --file-key <key>', 'Figma file key')
  .option('-u, --url <url>', 'Figma file URL')
  .option('-t, --token <token>', 'Figma access token')
  .option('-o, --output <dir>', 'Output directory', './src/components')
  .option('-s, --style <approach>', 'Style approach (styled-components, css-modules, tailwind, inline)')
  .option('--typescript', 'Use TypeScript', true)
  .option('--no-typescript', 'Use JavaScript')
  .option('--responsive', 'Generate responsive components', true)
  .option('--no-responsive', 'Generate static components')
  .option('--accessibility', 'Include accessibility features', true)
  .option('--no-accessibility', 'Skip accessibility features')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (options) => {
    try {
      await handleGenerate(options);
    } catch (error) {
      console.error(chalk.red('❌ Generation failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize configuration interactively')
  .option('-o, --output <dir>', 'Output directory', './src/components')
  .action(async (options) => {
    try {
      await handleInit(options);
    } catch (error) {
      console.error(chalk.red('❌ Initialization failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Preview command
program
  .command('preview')
  .description('Preview what would be generated')
  .option('-f, --file-key <key>', 'Figma file key')
  .option('-u, --url <url>', 'Figma file URL')
  .option('-t, --token <token>', 'Figma access token')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (options) => {
    try {
      await handlePreview(options);
    } catch (error) {
      console.error(chalk.red('❌ Preview failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List pages and components in Figma file')
  .option('-f, --file-key <key>', 'Figma file key')
  .option('-u, --url <url>', 'Figma file URL')
  .option('-t, --token <token>', 'Figma access token')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (options) => {
    try {
      await handleList(options);
    } catch (error) {
      console.error(chalk.red('❌ List failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Manage configuration')
  .option('--show', 'Show current configuration')
  .option('--validate', 'Validate configuration')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (options) => {
    try {
      await handleConfig(options);
    } catch (error) {
      console.error(chalk.red('❌ Config operation failed:'), (error as Error).message);
      process.exit(1);
    }
  });

async function handleGenerate(options: any) {
  console.log(chalk.blue.bold('🚀 Figma to React Code Generator\n'));

  // Load configuration
  const config = await loadConfig(options);
  const generator = new FigmaToReactGenerator(config);

  // Validate configuration
  const validation = generator.validateConfig();
  if (!validation.valid) {
    console.error(chalk.red('❌ Configuration errors:'));
    validation.errors.forEach(error => console.error(chalk.red(`  • ${error}`)));
    process.exit(1);
  }

  // Get file key
  const fileKey = getFileKey(options);
  if (!fileKey) {
    console.error(chalk.red('❌ Please provide either --file-key or --url'));
    process.exit(1);
  }

  // Start generation
  const spinner = ora('Generating React components...').start();
  
  try {
    const result = await generator.generateFromFile(fileKey);
    
    if (result.success) {
      spinner.succeed(chalk.green('✅ Generation completed successfully!'));
      
      console.log(chalk.green('\n📊 Generation Summary:'));
      console.log(`  • Components: ${result.components.length}`);
      console.log(`  • Stylesheets: ${result.styles.length}`);
      console.log(`  • Assets: ${result.assets.length}`);
      console.log(`  • Generation time: ${result.metadata.stats.generationTime}ms`);
      
      if (result.warnings && result.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warnings:'));
        result.warnings.forEach(warning => {
          console.log(chalk.yellow(`  • ${warning.message}`));
        });
      }
      
      console.log(chalk.green(`\n🎉 Components generated in: ${config.outputDir}`));
    } else {
      spinner.fail(chalk.red('❌ Generation failed'));
      
      if (result.errors && result.errors.length > 0) {
        console.log(chalk.red('\n💥 Errors:'));
        result.errors.forEach(error => {
          console.log(chalk.red(`  • ${error.message}`));
        });
      }
      
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(chalk.red('❌ Generation failed'));
    throw error;
  }
}

async function handleInit(options: any) {
  console.log(chalk.blue.bold('🔧 Initialize Figma to React Configuration\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'figmaToken',
      message: 'Figma access token:',
      validate: (input) => input.length > 0 || 'Token is required'
    },
    {
      type: 'list',
      name: 'styleApproach',
      message: 'Choose styling approach:',
      choices: [
        { name: 'Styled Components (CSS-in-JS)', value: 'styled-components' },
        { name: 'CSS Modules (Scoped CSS)', value: 'css-modules' },
        { name: 'Tailwind CSS (Utility-first)', value: 'tailwind' },
        { name: 'Inline Styles (React objects)', value: 'inline' }
      ]
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Target framework:',
      choices: [
        { name: 'React', value: 'react' },
        { name: 'Vue (coming soon)', value: 'vue', disabled: true },
        { name: 'Angular (coming soon)', value: 'angular', disabled: true },
        { name: 'Svelte (coming soon)', value: 'svelte', disabled: true }
      ]
    },
    {
      type: 'confirm',
      name: 'useTypeScript',
      message: 'Use TypeScript?',
      default: true
    },
    {
      type: 'input',
      name: 'outputDir',
      message: 'Output directory:',
      default: options.output || './src/components'
    },
    {
      type: 'list',
      name: 'componentNaming',
      message: 'Component naming convention:',
      choices: [
        { name: 'PascalCase (MyComponent)', value: 'PascalCase' },
        { name: 'camelCase (myComponent)', value: 'camelCase' }
      ]
    },
    {
      type: 'list',
      name: 'fileNaming',
      message: 'File naming convention:',
      choices: [
        { name: 'kebab-case (my-component)', value: 'kebab-case' },
        { name: 'PascalCase (MyComponent)', value: 'PascalCase' },
        { name: 'camelCase (myComponent)', value: 'camelCase' }
      ]
    },
    {
      type: 'confirm',
      name: 'responsive',
      message: 'Generate responsive components?',
      default: true
    },
    {
      type: 'confirm',
      name: 'accessibility',
      message: 'Include accessibility features?',
      default: true
    }
  ]);

  const config: GeneratorConfig = {
    figmaToken: answers.figmaToken,
    styleApproach: answers.styleApproach,
    framework: answers.framework,
    useTypeScript: answers.useTypeScript,
    outputDir: answers.outputDir,
    componentNaming: answers.componentNaming,
    fileNaming: answers.fileNaming,
    responsive: answers.responsive,
    accessibility: answers.accessibility,
    breakpoints: {
      xs: '320px',
      sm: '768px',
      md: '1024px',
      lg: '1280px',
      xl: '1920px'
    },
    plugins: []
  };

  // Save configuration
  const configPath = path.join(process.cwd(), 'figma-to-react.config.json');
  await fs.writeJson(configPath, config, { spaces: 2 });

  console.log(chalk.green(`\n✅ Configuration saved to: ${configPath}`));
  console.log(chalk.blue('\n🚀 You can now run: figma-to-react generate --file-key <your-file-key>'));
}

async function handlePreview(options: any) {
  console.log(chalk.blue.bold('👀 Preview Generation\n'));

  const config = await loadConfig(options);
  const generator = new FigmaToReactGenerator(config);

  const fileKey = getFileKey(options);
  if (!fileKey) {
    console.error(chalk.red('❌ Please provide either --file-key or --url'));
    process.exit(1);
  }

  const spinner = ora('Analyzing Figma file...').start();

  try {
    const preview = await generator.previewGeneration(fileKey);
    spinner.succeed(chalk.green('✅ Analysis complete'));

    console.log(chalk.green('\n📊 Preview Summary:'));
    console.log(`  • Total components: ${preview.componentCount}`);
    console.log(`  • Estimated files: ${preview.estimatedFiles}`);

    if (preview.components.length > 0) {
      console.log(chalk.blue('\n📝 Components to be generated:'));
      preview.components.forEach(comp => {
        console.log(`  • ${chalk.cyan(comp.name)} (${comp.type}/${comp.category})`);
      });
    }
  } catch (error) {
    spinner.fail(chalk.red('❌ Preview failed'));
    throw error;
  }
}

async function handleList(options: any) {
  console.log(chalk.blue.bold('📋 List Figma Contents\n'));

  const config = await loadConfig(options);
  const generator = new FigmaToReactGenerator(config);

  const fileKey = getFileKey(options);
  if (!fileKey) {
    console.error(chalk.red('❌ Please provide either --file-key or --url'));
    process.exit(1);
  }

  const spinner = ora('Fetching Figma file contents...').start();

  try {
    const [pages, components] = await Promise.all([
      generator.getPages(fileKey),
      generator.getComponents(fileKey)
    ]);

    spinner.succeed(chalk.green('✅ Contents fetched'));

    if (pages.length > 0) {
      console.log(chalk.blue('\n📄 Pages:'));
      pages.forEach(page => {
        console.log(`  • ${chalk.cyan(page.name)} (${page.id})`);
      });
    }

    if (components.length > 0) {
      console.log(chalk.blue('\n🧩 Components:'));
      components.forEach(comp => {
        console.log(`  • ${chalk.cyan(comp.name)} (${comp.id})`);
        if (comp.description) {
          console.log(`    ${chalk.gray(comp.description)}`);
        }
      });
    }
  } catch (error) {
    spinner.fail(chalk.red('❌ Failed to fetch contents'));
    throw error;
  }
}

async function handleConfig(options: any) {
  if (options.show) {
    const config = await loadConfig(options);
    console.log(chalk.blue.bold('🔧 Current Configuration:\n'));
    console.log(JSON.stringify(config, null, 2));
  } else if (options.validate) {
    const config = await loadConfig(options);
    const generator = new FigmaToReactGenerator(config);
    const validation = generator.validateConfig();
    
    if (validation.valid) {
      console.log(chalk.green('✅ Configuration is valid'));
    } else {
      console.log(chalk.red('❌ Configuration errors:'));
      validation.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
    }
  } else {
    console.log(chalk.yellow('Please specify --show or --validate'));
  }
}

async function loadConfig(options: any): Promise<Partial<GeneratorConfig>> {
  let config: Partial<GeneratorConfig> = {};

  // Load from config file if specified
  if (options.config) {
    try {
      config = await fs.readJson(options.config);
    } catch (error) {
      console.error(chalk.yellow(`⚠️  Could not load config file: ${options.config}`));
    }
  } else {
    // Try to load default config file
    const defaultConfigPath = path.join(process.cwd(), 'figma-to-react.config.json');
    if (await fs.pathExists(defaultConfigPath)) {
      try {
        config = await fs.readJson(defaultConfigPath);
      } catch (error) {
        console.error(chalk.yellow('⚠️  Could not load default config file'));
      }
    }
  }

  // Override with command line options
  if (options.token) config.figmaToken = options.token;
  if (options.output) config.outputDir = options.output;
  if (options.style) config.styleApproach = options.style as StyleApproach;
  if (options.typescript !== undefined) config.useTypeScript = options.typescript;
  if (options.responsive !== undefined) config.responsive = options.responsive;
  if (options.accessibility !== undefined) config.accessibility = options.accessibility;

  // Environment variables
  if (process.env.FIGMA_TOKEN && !config.figmaToken) {
    config.figmaToken = process.env.FIGMA_TOKEN;
  }

  return config;
}

function getFileKey(options: any): string | null {
  if (options.fileKey) {
    return options.fileKey;
  }
  
  if (options.url) {
    return FigmaApiClient.extractFileKey(options.url);
  }
  
  return null;
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error);
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}