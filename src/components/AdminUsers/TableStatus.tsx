import { tableElementProps } from './tableElements';

const TableStatus = ({ id, label, tone = `green` }: { id: string; label: string; tone?: `green` | `gray` | `red` }) => <div {...tableElementProps(`actionsCell`, id)}>
  <span {...tableElementProps(`rowStatus`, id)} className={`rowStatus is-${tone}`}>
    <span {...tableElementProps(`statusDotWrap`, id)} aria-hidden={`true`}><span {...tableElementProps(`statusDot`, id)} /></span>
    <span {...tableElementProps(`statusText`, id)}>{label}</span>
  </span>
</div>;

export default TableStatus;
