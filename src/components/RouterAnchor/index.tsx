import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

interface RouterAnchorProps extends ComponentPropsWithoutRef<`a`> {
  onPress?: unknown;
}

const RouterAnchor = forwardRef<HTMLAnchorElement, RouterAnchorProps>(
  ({ onPress: _onPress, ...props }, ref) => (
    <a
      ref={ref}
      {...props}
    />
  ),
);

RouterAnchor.displayName = `RouterAnchor`;

export default RouterAnchor;
