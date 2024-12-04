export const distanceToLineSegment = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
  
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
  
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
  
    let xx, yy;
  
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
  
    const dx = px - xx;
    const dy = py - yy;
  
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  export const getPolygonPoints = (
    sides: number,
    radius: number,
    centerX: number,
    centerY: number
  ): [number, number][] => {
    const points: [number, number][] = [];
    const angleStep = (2 * Math.PI) / sides;
  
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top center
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push([x, y]);
    }
  
    return points;
  };
  
  export const isPointInPolygon = (
    x: number,
    y: number,
    points: [number, number][]
  ): boolean => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i][0], yi = points[i][1];
      const xj = points[j][0], yj = points[j][1];
  
      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };