// Main entry point for the Figma to React Code Generator
export { FigmaToReactGenerator } from './core/figma-to-react-generator';
export { FigmaApiClient, FigmaApiError } from './api/figma-client';
export { CoreGenerator } from './generators/core-generator';
export { DesignParser } from './parsers/design-parser';

// Type exports
export * from './types/figma';
export * from './types/generator';

// Utility exports
export { ComponentNamer } from './utils/component-namer';
export { FileOrganizer } from './utils/file-organizer';

// Default export
export { FigmaToReactGenerator as default } from './core/figma-to-react-generator';