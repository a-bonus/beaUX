
import { buttonComponents } from './buttons';
import { layoutComponents } from './layout';
import { inputComponents } from './inputs';

export const allComponents = [
  ...buttonComponents,
  ...layoutComponents,
  ...inputComponents
];

// Export individual categories for more granular access if needed
export { buttonComponents, layoutComponents, inputComponents };
