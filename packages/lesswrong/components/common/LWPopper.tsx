import { registerComponent } from '../../lib/vulcan-lib';
import React, {useState} from 'react';
import Popper, { PopperPlacementType } from '@material-ui/core/Popper'
import classNames from 'classnames';
import { usePopper } from 'react-popper';
import { createPortal } from 'react-dom';

const styles = (theme: ThemeType): JssStyles => ({
  popper: {
    position: "absolute",
    zIndex: theme.zIndexes.lwPopper
  },
  default: {
    position: "relative",
    zIndex: theme.zIndexes.lwPopperTooltip,
  },
  tooltip: {
    backgroundColor: theme.palette.panelBackground.tooltipBackground,
    borderRadius: 3,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontSize: "1rem",
    padding: theme.spacing.unit,
    color: theme.palette.text.tooltipText,
    position: "relative",
    zIndex: theme.zIndexes.lwPopperTooltip,
  },
  noMouseEvents: {
    pointerEvents: "none",
  },
})

// This is a wrapper around the Popper library so we can easily replace it with different versions and
// implementations
const LWPopper = ({classes, children, className, tooltip=false, allowOverflow, open, anchorEl, placement, clickable = true}: {
  classes: ClassesType,
  children: any,
  tooltip?: boolean,
  allowOverflow?: boolean,
  open: boolean,
  placement?: PopperPlacementType,
  anchorEl: any,
  className?: string,
  clickable?: boolean
}) => {
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);

  const preventOverflowModifier = allowOverflow ? [{
    name: 'preventOverflow',
    enabled: false, 
  }] : undefined

  const { styles, attributes } = usePopper(anchorEl, popperElement, {
    placement,
    modifiers: preventOverflowModifier
  });

  if (!open)
    return null;
  
  return (
    // We use createPortal here to avoid having to deal with overflow problems and styling from the current child
    // context, by placing the Popper element directly into the document root
    // Rest of usage from https://popper.js.org/react-popper/v2/
    createPortal(
      <div
        ref={setPopperElement}
        className={classNames({[classes.tooltip]: tooltip, [classes.default]: !tooltip, [classes.noMouseEvents]: !clickable}, className)}
        style={styles.popper}
        {...attributes.popper}
      >
        { children }
      </div>,
      document.body
    )
  )
};

const LWPopperComponent = registerComponent('LWPopper', LWPopper, {styles});

declare global {
  interface ComponentTypes {
    LWPopper: typeof LWPopperComponent
  }
}
