const HeadingActions = ({ onTarget }: { onTarget: (target: HTMLElement | null) => void }) => <div id={`admin-dashboard-heading-actions`} className={`admin-dashboard-heading-actions`} ref={onTarget} />;
export default HeadingActions;
