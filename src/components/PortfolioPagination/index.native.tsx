import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { Pressable, Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { PORTFOLIO_PAGE_SIZES, type usePortfolioPagination } from '../DomainPortfolio/usePortfolioPagination';

interface Props {
  disabled?: boolean;
  pagination: ReturnType<typeof usePortfolioPagination>;
}

const PortfolioPagination = ({ pagination, disabled = false }: Props) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const previousDisabled = disabled || pagination.page <= 1;
  const nextDisabled = disabled || pagination.page >= pagination.pageCount;

  return (
    <View {...elementProps(`native-portfolio-pagination`)} style={styles.pagination}>
      <Text {...elementProps(`native-portfolio-pagination-range`)} style={styles.summary} accessibilityLiveRegion={`polite`}>
        {`${pagination.start}–${pagination.end} Of ${pagination.total} Expanded Domains`}
      </Text>
      <View {...elementProps(`native-portfolio-pagination-size`)} style={styles.row} accessibilityRole={`radiogroup`} accessibilityLabel={`Domains Per Page`}>
        <Text {...elementProps(`native-portfolio-pagination-size-label`)} style={styles.label}>{`Per Page`}</Text>
        {PORTFOLIO_PAGE_SIZES.map(size => (
          <Pressable
            key={size}
            disabled={disabled}
            accessibilityRole={`radio`}
            {...elementProps(`native-portfolio-pagination-size`, String(size))}
            onPress={() => pagination.setPageSize(size)}
            accessibilityLabel={`${size} Domains Per Page`}
            accessibilityState={{ checked: pagination.pageSize === size, disabled }}
            style={[styles.sizeButton, pagination.pageSize === size && styles.activeButton, disabled && styles.disabled]}
          >
            <Text {...elementProps(`native-portfolio-pagination-size-text`, String(size))} style={[styles.buttonText, pagination.pageSize === size && styles.activeText]}>{size}</Text>
          </Pressable>
        ))}
      </View>
      <View {...elementProps(`native-portfolio-pagination-controls`)} style={styles.row}>
        <Pressable
          disabled={previousDisabled}
          accessibilityRole={`button`}
          accessibilityLabel={`Previous Domain Page`}
          {...elementProps(`native-portfolio-pagination-previous`)}
          accessibilityState={{ disabled: previousDisabled }}
          onPress={() => pagination.setPage(pagination.page - 1)}
          style={[styles.button, previousDisabled && styles.disabled]}
        >
          <ChevronLeft {...elementProps(`native-portfolio-pagination-previous-icon`)} size={15} color={palette.accent} accessible={false} />
          <Text {...elementProps(`native-portfolio-pagination-previous-text`)} style={styles.buttonText}>{`Previous`}</Text>
        </Pressable>
        <Text {...elementProps(`native-portfolio-pagination-page`)} style={styles.page} accessibilityLiveRegion={`polite`}>
          {`${pagination.page} / ${pagination.pageCount}`}
        </Text>
        <Pressable
          disabled={nextDisabled}
          accessibilityRole={`button`}
          accessibilityLabel={`Next Domain Page`}
          {...elementProps(`native-portfolio-pagination-next`)}
          accessibilityState={{ disabled: nextDisabled }}
          onPress={() => pagination.setPage(pagination.page + 1)}
          style={[styles.button, nextDisabled && styles.disabled]}
        >
          <Text {...elementProps(`native-portfolio-pagination-next-text`)} style={styles.buttonText}>{`Next`}</Text>
          <ChevronRight {...elementProps(`native-portfolio-pagination-next-icon`)} size={15} color={palette.accent} accessible={false} />
        </Pressable>
      </View>
    </View>
  );
};

export default PortfolioPagination;
