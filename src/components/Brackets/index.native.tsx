import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import Svg, { G, Circle, Polygon, Text as SvgText } from 'react-native-svg';
import { bracketStacks } from './brackets';
import type { BracketsProps } from './types';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const Brackets = ({ suffix = `brackets` }: BracketsProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View
      pointerEvents={`none`}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      {...elementProps(`brackets`, suffix)}
      style={styles.panel}
    >
      <View {...elementProps(`brackets-header`, suffix)} style={styles.header}>
        <Text {...elementProps(`brackets-label`, suffix)} style={styles.label}>
          {`THE EXTENSION INDEX`}
        </Text>
        <ArrowUpRight size={17} accessible={false} color={`#56d4cc`} {...elementProps(`brackets-arrow`, suffix)} />
      </View>
      <View {...elementProps(`brackets-stacks`, suffix)} style={styles.stacks}>
        <Svg width={`100%`} height={`100%`} viewBox={`0 0 390 260`} {...elementProps(`brackets-tiles`, suffix)}>
          <G transform={`rotate(-5 195 130)`}>
            {bracketStacks.map((stack, stackIndex) => (
              <G key={stackIndex} {...elementProps(`brackets-stack`, `${suffix}-${stackIndex}`)}>
                {stack.map((extension, recordIndex) => {
                  const x = 15 + stackIndex * 179;
                  const y = 15 + recordIndex * 71 + stackIndex * 14;
                  const recordSuffix = `${suffix}-${stackIndex}-${recordIndex}-${extension.slice(1)}`;

                  return (
                    <G key={extension} {...elementProps(`brackets-record`, recordSuffix)}>
                      <Polygon
                        fill={`#f1f3f3`}
                        {...elementProps(`brackets-record-tile`, recordSuffix)}
                        points={`${x},${y} ${x + 150},${y} ${x + 170},${y + 20} ${x + 170},${y + 63} ${x},${y + 63}`}
                      />
                      <SvgText
                        x={x + 17}
                        y={y + 43}
                        fontSize={39}
                        letterSpacing={-2.4}
                        fill={palette.strong}
                        fontFamily={`DMSans_700Bold`}
                        {...elementProps(`brackets-record-label`, recordSuffix)}
                      >
                        {extension}
                      </SvgText>
                      <Circle r={5} cx={x + 148} cy={y + 31.5} fill={`#19aeab`} {...elementProps(`brackets-record-dot`, recordSuffix)} />
                    </G>
                  );
                })}
              </G>
            ))}
          </G>
        </Svg>
      </View>
      <View {...elementProps(`brackets-footer`, suffix)} style={styles.footer}>
        <Text {...elementProps(`brackets-caption`, suffix)} style={styles.caption}>
          {`EVERY ADDRESS IN ORDER.`}
        </Text>
        <Text {...elementProps(`brackets-symbol`, suffix)} style={styles.symbol}>
          {`[ DD ]`}
        </Text>
      </View>
    </View>
  );
};

export default Brackets;
