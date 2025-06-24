# Figma to JavaScript Code Generator - AI Development Prompt

## Objective

Build an intelligent Figma to JavaScript code generator that can convert Figma design files into clean, production-ready React components with accurate styling and structure. The generator should understand Figma's design system and translate visual designs into maintainable, accessible JavaScript code.

## Core Requirements

### Input Format Expectations

#### 1. Figma API Integration
- **Primary Input**: Figma File Key and Node IDs via Figma REST API
- **Authentication**: Figma Personal Access Token
- **API Endpoints**:
  - `GET /v1/files/:key` - Retrieve file structure and metadata
  - `GET /v1/files/:key/nodes` - Get specific nodes with styling information
  - `GET /v1/images/:key` - Export images and assets

#### 2. Expected Figma Data Structure
```javascript
// Sample input structure from Figma API
{
  "document": {
    "id": "node_id",
    "name": "Component Name",
    "type": "COMPONENT", // FRAME, GROUP, RECTANGLE, TEXT, etc.
    "children": [...],
    "fills": [...],
    "strokes": [...],
    "effects": [...],
    "constraints": {...},
    "absoluteBoundingBox": {...},
    "backgroundColor": {...},
    "layoutMode": "VERTICAL" | "HORIZONTAL" | "NONE",
    "layoutWrap": "NO_WRAP" | "WRAP",
    "itemSpacing": number,
    "paddingLeft": number,
    "paddingRight": number,
    "paddingTop": number,
    "paddingBottom": number
  }
}
```

#### 3. Plugin Alternative (Optional)
- Support for Figma Plugin SDK data export
- JSON export from custom Figma plugins
- Direct clipboard integration for selected nodes

### Output Format Requirements

#### 1. React Component Structure
Generate modern React functional components with:
- TypeScript support (optional flag)
- Proper component naming (PascalCase)
- Clean JSX structure
- Props interface definition
- Default export

#### 2. Styling Approach Options
Provide multiple styling output formats:

**Option A: CSS-in-JS (Styled Components)**
```javascript
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 320px;
  height: 200px;
  background-color: #ffffff;
  border-radius: 8px;
`;
```

**Option B: CSS Modules**
```javascript
import styles from './Component.module.css';

const Component = () => (
  <div className={styles.container}>
    {/* content */}
  </div>
);
```

**Option C: Tailwind CSS**
```javascript
const Component = () => (
  <div className="flex flex-col w-80 h-50 bg-white rounded-lg">
    {/* content */}
  </div>
);
```

**Option D: Inline Styles**
```javascript
const containerStyles = {
  display: 'flex',
  flexDirection: 'column',
  width: '320px',
  height: '200px',
  backgroundColor: '#ffffff',
  borderRadius: '8px'
};
```

## Technical Implementation Guidelines

### 1. Node Type Mapping
Create intelligent mapping for Figma node types:
- `FRAME` → `div` with layout properties
- `GROUP` → `div` wrapper
- `RECTANGLE` → `div` with background/border styles
- `TEXT` → `span`, `p`, `h1-h6` based on typography scale
- `ELLIPSE` → `div` with border-radius: 50%
- `VECTOR` → `svg` element or icon component
- `COMPONENT` → Custom React component
- `INSTANCE` → Component instance with props

### 2. Layout System Translation
- **Auto Layout** → CSS Flexbox or CSS Grid
- **Constraints** → CSS positioning and responsive behavior
- **Spacing** → Margin and padding values
- **Sizing** → Width, height, min/max constraints

### 3. Typography Conversion
```javascript
// Convert Figma text styles to CSS
const textStyleMapping = {
  fontFamily: figmaNode.style.fontFamily,
  fontSize: `${figmaNode.style.fontSize}px`,
  fontWeight: figmaNode.style.fontWeight,
  lineHeight: figmaNode.style.lineHeightPercent ? 
    `${figmaNode.style.lineHeightPercent}%` : 
    `${figmaNode.style.lineHeightPx}px`,
  letterSpacing: `${figmaNode.style.letterSpacing}px`,
  textAlign: figmaNode.style.textAlignHorizontal.toLowerCase()
};
```

### 4. Color and Fill Processing
- Convert Figma color objects to hex/rgba values
- Handle gradients and complex fills
- Support for design tokens/CSS variables
- Image fills → background-image or img tags

### 5. Responsive Design Considerations
- Generate responsive breakpoints based on Figma frames
- Handle different device variants
- Implement fluid typography and spacing
- Support for responsive images

## Advanced Features

### 1. Component Recognition
- Identify reusable components automatically
- Generate component library structure
- Handle component variants and states
- Create prop interfaces for dynamic content

### 2. Asset Management
- Export and optimize images
- Generate SVG components for icons
- Handle asset paths and imports
- Support for different image formats

### 3. State Management
- Identify interactive elements (buttons, forms)
- Generate state hooks for dynamic components
- Handle component variants as state changes
- Event handler stubs

### 4. Accessibility Features
- Generate semantic HTML structure
- Add ARIA labels and roles
- Implement proper heading hierarchy
- Color contrast considerations

## Code Quality Standards

### 1. Code Organization
```javascript
// File structure example
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.styles.ts
│   │   └── index.ts
│   └── Card/
│       ├── Card.tsx
│       ├── Card.styles.ts
│       └── index.ts
└── styles/
    ├── tokens.ts
    └── globals.css
```

### 2. Naming Conventions
- Components: PascalCase (`ButtonPrimary`)
- Props: camelCase (`onClick`, `isDisabled`)
- CSS classes: kebab-case or camelCase based on chosen approach
- Files: Match component names

### 3. Code Comments
- JSDoc comments for component interfaces
- Inline comments for complex styling logic
- TODO comments for missing functionality

## Configuration Options

### 1. Generation Settings
```javascript
const generatorConfig = {
  framework: 'react', // 'react' | 'vue' | 'vanilla'
  typescript: true,
  stylingApproach: 'styled-components', // 'css-modules' | 'tailwind' | 'inline'
  componentStructure: 'functional', // 'functional' | 'class'
  exportFormat: 'named', // 'default' | 'named'
  includeStorybook: false,
  responsive: true,
  designTokens: true
}
```

### 2. Figma Integration Settings
```javascript
const figmaConfig = {
  apiToken: 'figma_api_token',
  fileKey: 'figma_file_key',
  nodeIds: ['node_id_1', 'node_id_2'],
  includePrototyping: false,
  exportAssets: true,
  assetFormat: 'svg' // 'svg' | 'png' | 'jpg'
}
```

## Error Handling and Edge Cases

### 1. Missing Design Information
- Handle undefined styling properties gracefully
- Provide sensible defaults for missing values
- Generate TODO comments for manual review

### 2. Complex Layouts
- Fallback to CSS Grid for complex positioning
- Handle overlapping elements appropriately
- Manage z-index stacking contexts

### 3. Unsupported Features
- Document unsupported Figma features
- Provide manual implementation suggestions
- Generate placeholder code for review

## Example Output

For a simple Figma button component, generate:

```typescript
// Button.tsx
import React from 'react';
import styled from 'styled-components';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
}

const StyledButton = styled.button<ButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.size === 'small' ? '8px 16px' : 
                     props.size === 'large' ? '16px 32px' : '12px 24px'};
  background-color: ${props => props.variant === 'primary' ? '#007AFF' : '#F2F2F7'};
  color: ${props => props.variant === 'primary' ? '#FFFFFF' : '#000000'};
  border: none;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    opacity: 0.8;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
```

## Testing and Validation

### 1. Generated Code Quality
- Ensure valid HTML/JSX output
- Check CSS property validity
- Validate TypeScript interfaces
- Test component rendering

### 2. Design Fidelity
- Compare visual output with Figma design
- Validate spacing and typography accuracy
- Check color reproduction
- Verify responsive behavior

## Usage Instructions

1. **Setup**: Configure Figma API access and generator settings
2. **Input**: Provide Figma file URL or API data
3. **Processing**: Run the generator with specified options
4. **Output**: Review generated components and styling
5. **Integration**: Import components into your project
6. **Refinement**: Manual adjustments and optimizations

This prompt should guide you to create a robust, intelligent Figma to JavaScript code generator that produces high-quality, maintainable React components while preserving design fidelity and following modern development best practices.