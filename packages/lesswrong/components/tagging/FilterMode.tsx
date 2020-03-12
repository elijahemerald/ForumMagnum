import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { FilterMode, filterModes } from '../../lib/filterSettings';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    height: 32,
  },
  label: {
    width: 130,
    display: "inline-block",
    verticalAlign: "middle",
  },
  button: {
    cursor: "pointer",
    padding: 8,
    margin: 4,
    width: 60,
    verticalAlign: "middle",
  },
  selected: {
    background: "#ccc",
  },
  closeButton: {
    display: "inline-block",
    verticalAlign: "middle",
  },
});

const FilterMode = ({description, mode, canRemove=false, onChangeMode, onRemove, classes}: {
  description: string,
  mode: FilterMode,
  canRemove?: boolean,
  onChangeMode: (mode: FilterMode)=>void,
  onRemove?: ()=>void,
  classes: ClassesType,
}) => {
  return <div className={classes.root}>
    <span className={classes.label}>{description}</span>
    
    {filterModes.map((m: FilterMode) =>
      <span className={classNames(classes.button, {[classes.selected]: m===mode})} onClick={ev => onChangeMode(m)}>
        {m}
      </span>
    )}
    {canRemove && <div className={classes.closeButton} onClick={ev => {
      if (onRemove)
        onRemove();
    }}>
      X
    </div>}
  </div>
}

const FilterModeComponent = registerComponent("FilterMode", FilterMode, {styles});

declare global {
  interface ComponentTypes {
    FilterMode: typeof FilterModeComponent
  }
}
