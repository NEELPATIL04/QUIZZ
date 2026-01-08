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

interface CssRule {
  selector: string;
  properties: Record<string, string>;
}

function parseCssRules(css: string): Record<string, Record<string, string>> {
  const rules: Record<string, Record<string, string>> = {};

  // Remove comments
  const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Match selector { content } blocks
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;
  let hasRules = false;

  while ((match = ruleRegex.exec(cleanCss)) !== null) {
    hasRules = true;
    const selector = match[1].trim();
    const content = match[2];

    // Parse properties inside block
    const properties: Record<string, string> = {};
    const declarations = content.split(';').map(d => d.trim()).filter(d => d);

    for (const declaration of declarations) {
      const colonIndex = declaration.indexOf(':');
      if (colonIndex > -1) {
        const prop = declaration.substring(0, colonIndex).trim().toLowerCase();
        const val = declaration.substring(colonIndex + 1).trim().toLowerCase();
        if (prop && val) properties[prop] = val;
      }
    }

    // Handle comma-separated selectors by duplicating rules
    // e.g. "h1, h2" -> rules["h1"] = props, rules["h2"] = props
    selector.split(',').forEach(s => {
      rules[s.trim()] = properties;
    });
  }

  // If no braces found, treat entire string as properties (legacy single-block support)
  if (!hasRules && cleanCss.trim()) {
    const properties: Record<string, string> = {};
    const declarations = cleanCss.split(';').map(d => d.trim()).filter(d => d);
    for (const declaration of declarations) {
      const colonIndex = declaration.indexOf(':');
      if (colonIndex > -1) {
        const prop = declaration.substring(0, colonIndex).trim().toLowerCase();
        const val = declaration.substring(colonIndex + 1).trim().toLowerCase();
        if (prop && val) properties[prop] = val;
      }
    }
    // Use a dummy selector key ''
    rules[''] = properties;
  }

  return rules;
}

export function validateCss(
  userCss: string,
  idealCss: string,
  requiredProperties: string[],
  scoringCriteria: CssScoringCriteria,
  totalPoints: number
): ValidationResult {
  const userRules = parseCssRules(userCss);
  const idealRules = parseCssRules(idealCss);
  const idealSelectors = Object.keys(idealRules).filter(s => s !== '');

  // Check if it's a Multi-Selector Challenge (like Card Stacking)
  // We determine this if idealCss implies multiple distinct selectors
  if (idealSelectors.length > 1) {
    let totalRequiredChecks = 0;
    let passedChecks = 0;
    let missFeedback: string[] = [];

    // For each ideal selector, check if user has it and has required properties
    for (const sel of idealSelectors) {
      // Find best matching user selector (simple strict match for now, could be improved)
      const userProps = userRules[sel];

      // Define required properties for THIS selector based on idealCss
      // We assume properties present in idealRules[sel] AND in 'requiredProperties' list are strictly required
      // If requiredProperties is generic (like 'z-index'), we check if ideal has it.
      const ruleRequiredProps = requiredProperties.filter(p => Object.prototype.hasOwnProperty.call(idealRules[sel], p));

      if (ruleRequiredProps.length === 0) continue; // No requirements for this selector

      totalRequiredChecks += ruleRequiredProps.length;

      if (!userProps) {
        missFeedback.push(`Missing rule for '${sel}'`);
        continue;
      }

      // Check properties
      for (const reqProp of ruleRequiredProps) {
        if (userProps[reqProp]) {
          passedChecks++;
        } else {
          missFeedback.push(`'${sel}' missing '${reqProp}'`);
        }
      }
    }

    if (totalRequiredChecks === 0) {
      // Fallback if no specific requirements found?
      return { isCorrect: true, pointsAwarded: totalPoints, feedback: "Great job!", method: 'ideal' };
    }

    const scorePercent = passedChecks / totalRequiredChecks;
    const pointsAwarded = Math.round(totalPoints * scorePercent);
    const isCorrect = passedChecks === totalRequiredChecks; // Or > threshold? User said 3/4 is partial.
    // Actually, backend returns isCorrect boolean. If partial is allowed, isCorrect might be false but points > 0?
    // Usually isCorrect implies full completion.

    // User Requirement: "if they use all correct properties ... it good 100"
    // "not px perfect" -> We only checked EXISTENCE (`userProps[reqProp]`), not value equality.

    let feedback = isCorrect
      ? "Excellent! All containers stacked correctly."
      : `Partial match (${Math.round(scorePercent * 100)}%). ${missFeedback.slice(0, 3).join(', ')}...`;

    return {
      isCorrect: isCorrect || scorePercent > 0.8, // Be generous
      pointsAwarded,
      feedback,
      method: 'ideal'
    };
  }

  // --- Single Block / Legacy Logic ---

  // Flatten properties for single block comparison
  // Get the first available rule's properties
  const userPropsRecord = Object.values(userRules)[0] || {};

  // Reconstruct the array format existing logic expects
  const userPropsArray = Object.entries(userPropsRecord).map(([property, value]) => ({ property, value }));

  // Check if using ideal method (position: absolute with bottom and right)
  const hasPosition = userPropsArray.some(p =>
    p.property === 'position' && (p.value === 'absolute' || p.value === 'fixed')
  );
  const hasBottom = userPropsArray.some(p => p.property === 'bottom');
  const hasRight = userPropsArray.some(p => p.property === 'right');

  // Ideal method: position absolute/fixed + bottom + right
  if (hasPosition && hasBottom && hasRight) {
    return {
      isCorrect: true,
      pointsAwarded: totalPoints,
      feedback: scoringCriteria.idealMethod.description,
      method: 'ideal'
    };
  }

  // Alternative method: using margin
  const hasMargin = userPropsArray.some(p =>
    p.property.includes('margin') || p.property === 'float'
  );

  if (hasMargin) {
    const pointsAwarded = Math.max(
      totalPoints - scoringCriteria.alternativeMethod.pointsDeduction,
      totalPoints * 0.5
    );

    return {
      isCorrect: true,
      pointsAwarded: Math.floor(pointsAwarded),
      feedback: scoringCriteria.alternativeMethod.description,
      method: 'alternative'
    };
  }

  return {
    isCorrect: false,
    pointsAwarded: 0,
    feedback: 'Try using position: absolute with bottom and right properties.',
    method: 'incorrect'
  };
}

// Keep helper for backward compat or other files?
function parseCssProperties(css: string): { property: string, value: string }[] {
  const rules = parseCssRules(css);
  // Flatten all
  const results: { property: string, value: string }[] = [];
  Object.values(rules).forEach(props => {
    Object.entries(props).forEach(([property, value]) => {
      results.push({ property, value });
    })
  });
  return results;
}
