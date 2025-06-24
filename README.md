# Figma to React Code Generator

An advanced, intelligent code generator that transforms Figma designs into production-ready React components with TypeScript support.

## 🚀 Features

### Core Capabilities
- **Intelligent Component Recognition**: Automatically identifies reusable components and creates proper hierarchies
- **Multiple Styling Options**: Support for Styled Components, CSS Modules, Tailwind CSS, and inline styles
- **Layout System Translation**: Converts Figma's Auto Layout to modern CSS Flexbox/Grid
- **Advanced Node Mapping**: Proper conversion of FRAME → div, TEXT → typography elements, etc.
- **TypeScript Support**: Full TypeScript interfaces and component props
- **Responsive Design**: Generates responsive components with proper breakpoints
- **Accessibility Features**: Includes ARIA attributes and semantic HTML

### Styling Approaches
1. **Styled Components**: CSS-in-JS with theme support
2. **CSS Modules**: Scoped CSS with BEM naming conventions
3. **Tailwind CSS**: Utility-first CSS framework integration
4. **Inline Styles**: Direct React style objects

### Component Types
- **Layout Components**: Containers, sections, grids
- **UI Components**: Buttons, inputs, cards, modals
- **Typography**: Headings, paragraphs, text styles
- **Media**: Images, icons, illustrations
- **Interactive**: Forms, navigation, controls

## 📦 Installation

```bash
npm install -g @figma-to-react/code-generator
```

## 🔧 Usage

### CLI Interface
```bash
# Generate components from Figma file
figma-to-react generate --file-key YOUR_FIGMA_FILE_KEY --token YOUR_FIGMA_TOKEN

# Interactive setup
figma-to-react init

# Generate with specific styling
figma-to-react generate --style styled-components --typescript true
```

### Programmatic API
```typescript
import { FigmaToReactGenerator } from '@figma-to-react/code-generator';

const generator = new FigmaToReactGenerator({
  figmaToken: 'your-token',
  styleApproach: 'styled-components',
  useTypeScript: true,
  responsive: true,
  accessibility: true
});

const result = await generator.generateFromFile('file-key');
```

## ⚙️ Configuration

Create a `figma-to-react.config.js` file in your project root:

```javascript
module.exports = {
  figmaToken: process.env.FIGMA_TOKEN,
  styleApproach: 'styled-components', // 'styled-components' | 'css-modules' | 'tailwind' | 'inline'
  useTypeScript: true,
  outputDir: './src/components',
  responsive: true,
  accessibility: true,
  componentNaming: 'PascalCase',
  fileNaming: 'kebab-case'
};
```

## 🏗️ Architecture

```
src/
├── api/              # Figma API client
├── parsers/          # Design structure analysis
├── generators/       # Code generation engines
├── mappers/          # Node type mappings
├── utils/            # Utility functions
├── types/            # TypeScript definitions
├── templates/        # Code templates
└── cli/              # Command line interface
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.