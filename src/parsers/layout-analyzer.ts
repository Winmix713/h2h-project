import { FigmaNode } from '../types/figma';
import { LayoutStyles, ResponsiveConfig, ResponsiveBehavior } from '../types/generator';

export class LayoutAnalyzer {
  /**
   * Analyze and convert Figma Auto Layout to CSS Flexbox/Grid
   */
  analyzeLayout(node: FigmaNode): LayoutStyles {
    const layout: LayoutStyles = {
      display: 'block'
    };

    // Auto Layout detection
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      layout.display = 'flex';
      
      // Direction
      layout.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
      
      // Primary axis alignment (justify-content)
      if (node.primaryAxisAlignItems) {
        layout.justifyContent = this.mapPrimaryAxisAlignment(node.primaryAxisAlignItems);
      }
      
      // Counter axis alignment (align-items)
      if (node.counterAxisAlignItems) {
        layout.alignItems = this.mapCounterAxisAlignment(node.counterAxisAlignItems);
      }
      
      // Wrapping
      if (node.layoutWrap === 'WRAP') {
        layout.flexWrap = 'wrap';
      }
      
      // Spacing (gap)
      if (node.itemSpacing && node.itemSpacing > 0) {
        layout.gap = `${node.itemSpacing}px`;
      }
    }

    // Grid layout detection
    if (this.isGridLayout(node)) {
      const gridLayout = this.analyzeGridLayout(node);
      Object.assign(layout, gridLayout);
    }

    // Sizing
    if (node.absoluteBoundingBox) {
      const bounds = node.absoluteBoundingBox;
      
      // Width and height
      layout.width = this.calculateWidth(node);
      layout.height = this.calculateHeight(node);
      
      // Min/max constraints
      const constraints = this.calculateSizeConstraints(node);
      if (constraints.minWidth) layout.minWidth = constraints.minWidth;
      if (constraints.maxWidth) layout.maxWidth = constraints.maxWidth;
      if (constraints.minHeight) layout.minHeight = constraints.minHeight;
      if (constraints.maxHeight) layout.maxHeight = constraints.maxHeight;
    }

    // Position
    const position = this.analyzePosition(node);
    if (position) {
      Object.assign(layout, position);
    }

    // Overflow
    if (node.overflowDirection) {
      layout.overflow = this.mapOverflow(node.overflowDirection);
    }

    return layout;
  }

  /**
   * Analyze responsive behavior
   */
  analyzeResponsive(node: FigmaNode): ResponsiveConfig | undefined {
    // Check for responsive design indicators
    const hasConstraints = node.constraints &&
      (node.constraints.horizontal !== 'LEFT' || node.constraints.vertical !== 'TOP');
    
    const hasFillContainer = node.layoutGrow && node.layoutGrow > 0;
    
    const hasResponsiveSizing = node.primaryAxisSizingMode === 'AUTO' ||
                               node.counterAxisSizingMode === 'AUTO';

    if (!hasConstraints && !hasFillContainer && !hasResponsiveSizing) {
      return undefined;
    }

    const behavior = this.determineResponsiveBehavior(node);
    
    return {
      breakpoints: {
        xs: '320px',
        sm: '768px',
        md: '1024px',
        lg: '1280px',
        xl: '1920px'
      },
      behavior
    };
  }

  /**
   * Check if node represents a grid layout
   */
  private isGridLayout(node: FigmaNode): boolean {
    if (!node.children || node.children.length < 4) return false;

    // Check if children are arranged in a grid pattern
    const positions = node.children.map(child => ({
      x: child.absoluteBoundingBox?.x || 0,
      y: child.absoluteBoundingBox?.y || 0,
      width: child.absoluteBoundingBox?.width || 0,
      height: child.absoluteBoundingBox?.height || 0
    }));

    // Simple grid detection: check for consistent spacing
    const rows = this.groupByRows(positions);
    const cols = this.groupByCols(positions);

    return rows.length > 1 && cols.length > 1 && 
           this.hasConsistentSpacing(positions);
  }

  /**
   * Analyze grid layout properties
   */
  private analyzeGridLayout(node: FigmaNode): Partial<LayoutStyles> {
    if (!node.children) return {};

    const positions = node.children.map(child => ({
      x: child.absoluteBoundingBox?.x || 0,
      y: child.absoluteBoundingBox?.y || 0,
      width: child.absoluteBoundingBox?.width || 0,
      height: child.absoluteBoundingBox?.height || 0
    }));

    const cols = this.groupByCols(positions);
    const rows = this.groupByRows(positions);

    const gridLayout: Partial<LayoutStyles> = {
      display: 'grid',
      gridTemplateColumns: this.generateGridColumns(cols),
      gridTemplateRows: this.generateGridRows(rows)
    };

    // Grid gap
    const gap = this.calculateGridGap(positions);
    if (gap) {
      gridLayout.gridGap = gap;
    }

    return gridLayout;
  }

  /**
   * Calculate width based on constraints and sizing mode
   */
  private calculateWidth(node: FigmaNode): string {
    const bounds = node.absoluteBoundingBox;
    if (!bounds) return 'auto';

    // Check for fill container behavior
    if (node.layoutGrow && node.layoutGrow > 0) {
      return '100%';
    }

    // Check for auto width
    if (node.primaryAxisSizingMode === 'AUTO' && node.layoutMode === 'HORIZONTAL') {
      return 'auto';
    }

    if (node.counterAxisSizingMode === 'AUTO' && node.layoutMode === 'VERTICAL') {
      return 'auto';
    }

    // Check constraints
    if (node.constraints) {
      switch (node.constraints.horizontal) {
        case 'LEFT_RIGHT':
        case 'SCALE':
          return '100%';
        case 'CENTER':
          return `${bounds.width}px`;
        default:
          return `${bounds.width}px`;
      }
    }

    return `${bounds.width}px`;
  }

  /**
   * Calculate height based on constraints and sizing mode
   */
  private calculateHeight(node: FigmaNode): string {
    const bounds = node.absoluteBoundingBox;
    if (!bounds) return 'auto';

    // Check for fill container behavior
    if (node.layoutAlign === 'STRETCH') {
      return '100%';
    }

    // Check for auto height
    if (node.primaryAxisSizingMode === 'AUTO' && node.layoutMode === 'VERTICAL') {
      return 'auto';
    }

    if (node.counterAxisSizingMode === 'AUTO' && node.layoutMode === 'HORIZONTAL') {
      return 'auto';
    }

    // Text elements should typically be auto height
    if (node.type === 'TEXT') {
      return 'auto';
    }

    // Check constraints
    if (node.constraints) {
      switch (node.constraints.vertical) {
        case 'TOP_BOTTOM':
        case 'SCALE':
          return '100%';
        case 'CENTER':
          return `${bounds.height}px`;
        default:
          return `${bounds.height}px`;
      }
    }

    return `${bounds.height}px`;
  }

  /**
   * Calculate size constraints (min/max width/height)
   */
  private calculateSizeConstraints(node: FigmaNode): {
    minWidth?: string;
    maxWidth?: string;
    minHeight?: string;
    maxHeight?: string;
  } {
    const constraints: any = {};
    const bounds = node.absoluteBoundingBox;
    
    if (!bounds) return constraints;

    // For text elements, set min-width to prevent shrinking below content
    if (node.type === 'TEXT') {
      constraints.minWidth = 'min-content';
    }

    // For containers with fixed content, set appropriate constraints
    if (node.layoutMode && node.children && node.children.length > 0) {
      if (node.primaryAxisSizingMode === 'FIXED') {
        if (node.layoutMode === 'HORIZONTAL') {
          constraints.minWidth = `${bounds.width}px`;
        } else {
          constraints.minHeight = `${bounds.height}px`;
        }
      }
    }

    return constraints;
  }

  /**
   * Analyze position properties
   */
  private analyzePosition(node: FigmaNode): Partial<LayoutStyles> | null {
    // For absolute positioning, we'd need more context about the parent
    // This is a simplified implementation
    
    if (node.constraints && node.constraints.horizontal === 'SCALE' && 
        node.constraints.vertical === 'SCALE') {
      return {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0'
      };
    }

    return null;
  }

  /**
   * Determine responsive behavior based on node properties
   */
  private determineResponsiveBehavior(node: FigmaNode): ResponsiveBehavior {
    // Fill container = scale
    if (node.layoutGrow && node.layoutGrow > 0) {
      return 'scale';
    }

    // Auto sizing = custom responsive behavior
    if (node.primaryAxisSizingMode === 'AUTO' || 
        node.counterAxisSizingMode === 'AUTO') {
      return 'custom';
    }

    // Stack on mobile for horizontal layouts
    if (node.layoutMode === 'HORIZONTAL') {
      return 'stack';
    }

    return 'scale';
  }

  // Helper methods for layout mapping

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
      default: return 'stretch';
    }
  }

  private mapOverflow(overflowDirection: string): string {
    switch (overflowDirection) {
      case 'HORIZONTAL_SCROLLING': return 'overflow-x: auto';
      case 'VERTICAL_SCROLLING': return 'overflow-y: auto';
      case 'HORIZONTAL_AND_VERTICAL_SCROLLING': return 'auto';
      default: return 'visible';
    }
  }

  // Grid layout helper methods

  private groupByRows(positions: Array<{x: number, y: number, width: number, height: number}>): number[][] {
    const tolerance = 5; // 5px tolerance for alignment
    const rows: number[][] = [];
    
    positions.forEach((pos, index) => {
      let foundRow = false;
      for (const row of rows) {
        const firstInRow = positions[row[0]];
        if (Math.abs(pos.y - firstInRow.y) <= tolerance) {
          row.push(index);
          foundRow = true;
          break;
        }
      }
      if (!foundRow) {
        rows.push([index]);
      }
    });

    return rows;
  }

  private groupByCols(positions: Array<{x: number, y: number, width: number, height: number}>): number[][] {
    const tolerance = 5; // 5px tolerance for alignment
    const cols: number[][] = [];
    
    positions.forEach((pos, index) => {
      let foundCol = false;
      for (const col of cols) {
        const firstInCol = positions[col[0]];
        if (Math.abs(pos.x - firstInCol.x) <= tolerance) {
          col.push(index);
          foundCol = true;
          break;
        }
      }
      if (!foundCol) {
        cols.push([index]);
      }
    });

    return cols;
  }

  private hasConsistentSpacing(positions: Array<{x: number, y: number, width: number, height: number}>): boolean {
    if (positions.length < 4) return false;

    const rows = this.groupByRows(positions);
    if (rows.length < 2) return false;

    // Check horizontal spacing consistency
    const firstRowSpacing = this.calculateRowSpacing(rows[0], positions);
    const secondRowSpacing = this.calculateRowSpacing(rows[1], positions);
    
    return Math.abs(firstRowSpacing - secondRowSpacing) <= 5; // 5px tolerance
  }

  private calculateRowSpacing(rowIndices: number[], positions: Array<{x: number, y: number, width: number, height: number}>): number {
    if (rowIndices.length < 2) return 0;
    
    rowIndices.sort((a, b) => positions[a].x - positions[b].x);
    
    let totalSpacing = 0;
    let spacingCount = 0;
    
    for (let i = 1; i < rowIndices.length; i++) {
      const prev = positions[rowIndices[i - 1]];
      const curr = positions[rowIndices[i]];
      const spacing = curr.x - (prev.x + prev.width);
      if (spacing >= 0) {
        totalSpacing += spacing;
        spacingCount++;
      }
    }
    
    return spacingCount > 0 ? totalSpacing / spacingCount : 0;
  }

  private generateGridColumns(cols: number[][]): string {
    // Simple implementation - could be more sophisticated
    return `repeat(${cols.length}, 1fr)`;
  }

  private generateGridRows(rows: number[][]): string {
    // Simple implementation - could be more sophisticated
    return `repeat(${rows.length}, auto)`;
  }

  private calculateGridGap(positions: Array<{x: number, y: number, width: number, height: number}>): string | null {
    const rows = this.groupByRows(positions);
    const cols = this.groupByCols(positions);
    
    if (rows.length < 2 || cols.length < 2) return null;
    
    // Calculate average horizontal gap
    const horizontalGap = this.calculateRowSpacing(rows[0], positions);
    
    // Calculate average vertical gap
    let verticalGap = 0;
    if (rows.length > 1) {
      cols.sort((a, b) => positions[a[0]].x - positions[b[0]].x);
      const firstCol = cols[0];
      if (firstCol.length > 1) {
        firstCol.sort((a, b) => positions[a].y - positions[b].y);
        const first = positions[firstCol[0]];
        const second = positions[firstCol[1]];
        verticalGap = second.y - (first.y + first.height);
      }
    }
    
    if (Math.abs(horizontalGap - verticalGap) <= 2) {
      return `${Math.round(horizontalGap)}px`;
    }
    
    return `${Math.round(verticalGap)}px ${Math.round(horizontalGap)}px`;
  }
}