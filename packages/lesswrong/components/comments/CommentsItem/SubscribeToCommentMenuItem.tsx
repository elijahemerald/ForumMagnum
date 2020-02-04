import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import Users from 'meteor/vulcan:users';
import withUser from '../../common/withUser';
// import CheckCircle from '@material-ui/icons/CheckCircle';
import CheckCircleOutline from '@material-ui/icons/CheckCircleOutline';
import ListItemIcon from '@material-ui/core/ListItemIcon';

// TODO: make this actually work
const SubscribeToCommentMenuItem = ({ currentUser, comment }) => {
  if (Users.canDo(currentUser, "comments.edit.all") ||
      Users.owns(currentUser, comment)) {
        return (
          <MenuItem>
            <ListItemIcon>
              <CheckCircleOutline/>
            </ListItemIcon>
             Subscribe to Thread
          </MenuItem>
        )
  } else {
    return null
  }
}

const SubscribeToCommentMenuItemComponent = registerComponent('SubscribeToCommentMenuItem', SubscribeToCommentMenuItem, withUser);

declare global {
  interface ComponentTypes {
    SubscribeToCommentMenuItem: typeof SubscribeToCommentMenuItemComponent
  }
}
