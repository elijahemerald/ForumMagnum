import { Components, registerComponent} from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { Snippet } from 'react-instantsearch-dom';
import type { Hit } from 'react-instantsearch-core';
import React from 'react';
import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    color: theme.palette.grey[600],
    marginRight: 12,
    marginLeft: 4
  },
  snippet: {
    overflowWrap: "break-word",
    ...theme.typography.body2,
    wordBreak: "break-word",
    color: theme.palette.grey[600],
  }
})

const isLeftClick = (event: MouseEvent): boolean => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const CommentsSearchHit = ({hit, clickAction, classes, showIcon=false}: {
  hit: Hit<any>,
  clickAction?: any,
  classes: ClassesType,
  showIcon?: boolean
}) => {
  const comment = (hit as AlgoliaComment);
  const { LWTooltip } = Components
  const url = "/posts/" + comment.postId + "/" + comment.postSlug + "#" + comment._id
  return <div className={classes.root}>
    {showIcon && <LWTooltip title="Comment">
      <ChatBubbleOutlineIcon className={classes.icon}/>
    </LWTooltip>}
    <Link to={url} onClick={(event: MouseEvent) => isLeftClick(event) && clickAction && clickAction()}>
      <div>
        <Components.MetaInfo>{comment.authorDisplayName}</Components.MetaInfo>
        <Components.MetaInfo>{comment.baseScore} karma </Components.MetaInfo>
        <Components.MetaInfo>
          <Components.FormatDate date={comment.postedAt}/>
        </Components.MetaInfo>
      </div>
      <div className={classes.snippet}>
        <Snippet className={classes.snippet} attribute="body" hit={comment} tagName="mark" />
      </div>
    </Link>
  </div>
}

const CommentsSearchHitComponent = registerComponent("CommentsSearchHit", CommentsSearchHit, {styles});

declare global {
  interface ComponentTypes {
    CommentsSearchHit: typeof CommentsSearchHitComponent
  }
}

