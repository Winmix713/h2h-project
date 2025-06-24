module.exports = {
  // Figma access token (get from https://www.figma.com/developers/api#access-tokens)
  figmaToken: process.env.FIGMA_TOKEN,

  // Styling approach
  styleApproach: 'styled-components', // 'styled-components' | 'css-modules' | 'tailwind' | 'inline'

  // Framework
  framework: 'react', // 'react' | 'vue' | 'angular' | 'svelte'

  // Use TypeScript
  useTypeScript: true,

  // Output directory
  outputDir: './src/components',

  // Generate responsive components
  responsive: true,

  // Include accessibility features
  accessibility: true,

  // Naming conventions
  componentNaming: 'PascalCase', // 'PascalCase' | 'camelCase' | 'kebab-case' | 'snake_case'
  fileNaming: 'kebab-case',     // 'PascalCase' | 'camelCase' | 'kebab-case' | 'snake_case'

  // CSS framework (optional)
  cssFramework: 'tailwind', // 'tailwind' | 'bootstrap' | 'bulma' | 'chakra' | 'material-ui' | 'ant-design'

  // Theme configuration
  theme: {
    colors: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
    },
    typography: {
      fontFamily: {
        sans: 'Inter, system-ui, sans-serif',
        serif: 'Georgia, serif',
        mono: 'Menlo, Monaco, monospace'
      }
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px'
    }
  },

  // Responsive breakpoints
  breakpoints: {
    xs: '320px',
    sm: '768px',
    md: '1024px',
    lg: '1280px',
    xl: '1920px'
  },

  // Custom node mappings
  customMappings: {
    'Button': {
      element: 'button',
      props: {
        type: 'button'
      }
    },
    'Input': {
      element: 'input',
      props: {
        type: 'text'
      }
    }
  },

  // Plugins
  plugins: [
    {
      name: 'storybook',
      options: {
        generateStories: true,
        storiesDir: './src/stories'
      }
    },
    {
      name: 'testing',
      options: {
        generateTests: true,
        testingLibrary: 'react-testing-library'
      }
    },
    {
      name: 'icons',
      options: {
        generateIconComponents: true,
        iconLibrary: 'lucide-react'
      }
    }
  ]
};