import { useState } from 'react';
import { stackPillPath } from './shape';
import { styles } from './styles.native';
import Svg, { Path } from 'react-native-svg';
import type { StackPillShapeProps } from './shape';
import { elementProps } from '../../shared/elementProps';
import { View, type LayoutChangeEvent } from 'react-native';

const StackPillShape = ({ id, sharp = false, fill = `transparent`, stroke = `transparent` }: StackPillShapeProps) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const measure = ({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;
    setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
  };
  return (
    <View
      accessible={false}
      onLayout={measure}
      style={[styles.shape, { pointerEvents: `none` }]}
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      {...elementProps(`stack-pill-shape`, id)}
    >
      <Svg
        width={size.width}
        height={size.height}
        accessible={false}
        {...elementProps(`stack-pill-shape-svg`, id)}
      >
        <Path
          fill={fill}
          stroke={stroke}
          strokeWidth={1}
          d={stackPillPath(size.width, size.height, sharp)}
          {...elementProps(`stack-pill-shape-path`, id)}
        />
      </Svg>
    </View>
  );
};

export default StackPillShape;
