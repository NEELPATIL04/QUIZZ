interface CssScoringCriteria {
  idealMethod: {
    properties: string[];
    points: number;
    description: string;
  };
  alternativeMethod: {
    properties: string[];
    pointsDeduction: number;
    description: string;
  };
  optionalProperties: string[];
}

interface ValidationResult {
  isCorrect: boolean;
  pointsAwarded: number;
  feedback: string;
  method: 'ideal' | 'alternative' | 'incorrect';
}

export function validateCss(
  userCss: string,
  idealCss: string,
  requiredProperties: string[],
  scoringCriteria: CssScoringCriteria,
  totalPoints: number
): ValidationResult {
  // Parse CSS to extract properties
  const userProps = parseCssProperties(userCss);
  const idealProps = parseCssProperties(idealCss);

  // Check if using ideal method (position: absolute with bottom and right)
  const hasPosition = userProps.some(p =>
    p.property === 'position' && (p.value === 'absolute' || p.value === 'fixed')
  );
  const hasBottom = userProps.some(p => p.property === 'bottom');
  const hasRight = userProps.some(p => p.property === 'right');

  // Ideal method: position absolute/fixed + bottom + right
  if (hasPosition && hasBottom && hasRight) {
    return {
      isCorrect: true,
      pointsAwarded: totalPoints,
      feedback: scoringCriteria.idealMethod.description,
      method: 'ideal'
    };
  }

  // Alternative method: using margin (check if bottom-right position is achieved)
  const hasMargin = userProps.some(p =>
    p.property.includes('margin') || p.property === 'float'
  );

  if (hasMargin) {
    // Give partial credit for alternative approach
    const pointsAwarded = Math.max(
      totalPoints - scoringCriteria.alternativeMethod.pointsDeduction,
      totalPoints * 0.5 // Minimum 50% points
    );

    return {
      isCorrect: true,
      pointsAwarded: Math.floor(pointsAwarded),
      feedback: scoringCriteria.alternativeMethod.description,
      method: 'alternative'
    };
  }

  // Incorrect: position not achieved
  return {
    isCorrect: false,
    pointsAwarded: 0,
    feedback: 'The card was not positioned to the bottom-right corner. Try using position: absolute with bottom and right properties.',
    method: 'incorrect'
  };
}

interface CssProperty {
  property: string;
  value: string;
}

function parseCssProperties(css: string): CssProperty[] {
  const properties: CssProperty[] = [];

  // Remove comments
  const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Split by semicolon and parse each property
  const declarations = cleanCss.split(';').map(d => d.trim()).filter(d => d);

  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;

    const property = declaration.substring(0, colonIndex).trim().toLowerCase();
    const value = declaration.substring(colonIndex + 1).trim().toLowerCase();

    if (property && value) {
      properties.push({ property, value });
    }
  }

  return properties;
}

export function compareCssApproaches(userCss: string, idealCss: string): {
  matchPercentage: number;
  usedIdealApproach: boolean;
} {
  const userProps = parseCssProperties(userCss);
  const idealProps = parseCssProperties(idealCss);

  // Check if user used the same properties as ideal
  let matchCount = 0;
  const idealPropertyNames = idealProps.map(p => p.property);

  for (const userProp of userProps) {
    if (idealPropertyNames.includes(userProp.property)) {
      matchCount++;
    }
  }

  const matchPercentage = idealProps.length > 0
    ? (matchCount / idealProps.length) * 100
    : 0;

  const usedIdealApproach = matchPercentage >= 80; // 80% match = ideal approach

  return {
    matchPercentage: Math.round(matchPercentage),
    usedIdealApproach
  };
}
