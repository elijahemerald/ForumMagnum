import { Components, registerComponent, } from '../../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../../lib/reactRouterWrapper';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { prettyEventDateTimes } from '../../../lib/collections/posts/helpers';
import { useTimezone } from '../../common/withTimezone';
import { forumTypeSetting } from '../../../lib/instanceSettings';
import { getDefaultEventImg } from './HighlightedEventCard';
import { useCurrentUser } from '../../common/withUser';
import classNames from 'classnames';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  noResults: {
    ...theme.typography.commentStyle,
    gridColumn: '1 / 4',
    textAlign: 'center',
    fontSize: 18,
  },
  noResultsText: {
    marginTop: 10
  },
  noResultsCTA: {
    fontSize: 14,
    marginTop: 20
  },
  communityLink: {
    color: theme.palette.primary.main,
  },
  eventCard: {
    position: 'relative',
    width: 373,
    height: 374,
    borderRadius: 0,
    overflow: 'visible',
    boxShadow: theme.palette.boxShadow.eventCard,
    [theme.breakpoints.down('xs')]: {
      maxWidth: '100vw'
    }
  },
  eventCardTag: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: theme.palette.buttons.eventCardTag,
    color: theme.palette.buttons.primaryDarkText,
    fontSize: 12,
    padding: '6px 12px',
    borderRadius: 20
  },
  eventCardContent: {
    position: 'relative',
    height: 170,
  },
  eventCardTime: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    color: theme.palette.primary.main
  },
  eventCardTimeApply: {
    color: theme.palette.text.dim,
    fontSize: 11,
    marginRight: 5
  },
  eventCardTitle: {
    ...theme.typography.headline,
    fontSize: 20,
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 0
  },
  eventCardLocation: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.slightlyDim2,
    fontSize: 14,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    marginTop: 8,
  },
  eventCardGroup: {
    ...theme.typography.commentStyle,
    maxWidth: 290,
    fontStyle: 'italic',
    color: theme.palette.text.dim,
    fontSize: 14,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    marginTop: 10,
  },
  addToCal: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    bottom: 20,
    right: 20,
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
}))


const EventCards = ({events, loading, numDefaultCards, hideSpecialCards, hideGroupNames, cardClassName, classes}: {
  events: PostsList[],
  loading?: boolean,
  numDefaultCards?: number,
  hideSpecialCards?: boolean,
  hideGroupNames?: boolean,
  cardClassName?: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const { timezone } = useTimezone()
  
  const getEventLocation = (event: PostsList): string => {
    if (event.onlineEvent) return 'Online'
    return event.location ? event.location.slice(0, event.location.lastIndexOf(',')) : ''
  }
  
  const { AddToCalendarButton, PostsItemTooltipWrapper, CloudinaryImage2, VirtualProgramCard } = Components
  
  // while the data is loading, show some placeholder empty cards
  if (loading && !events.length) {
    return numDefaultCards ? <>
      {_.range(numDefaultCards).map((i) => {
        return <Card key={i} className={classNames(classes.eventCard, cardClassName)}></Card>
      })}
    </> : null
  }
  
  const eventCards = events.map(event => {
    return <Card key={event._id} className={classNames(classes.eventCard, cardClassName)}>
      <Link to={`/events/${event._id}/${event.slug}`}>
        {event.eventImageId ?
          <CloudinaryImage2 height={200} width={373} publicId={event.eventImageId} imgProps={{q: '100'}} /> :
          <img src={getDefaultEventImg(373)} style={{height: 200, width: 373}} />}
      </Link>
      {event.eventType === 'conference' && <div className={classes.eventCardTag}>Conference</div>}
      <CardContent className={classes.eventCardContent}>
        <div className={classes.eventCardTime}>
          {event.eventType === 'course' && <span className={classes.eventCardTimeApply}>Apply by</span>}
          {prettyEventDateTimes(event, timezone, true)}
        </div>
        <PostsItemTooltipWrapper post={event}>
          <div className={classes.eventCardTitle}>
            <Link to={`/events/${event._id}/${event.slug}`}>{event.title}</Link>
          </div>
        </PostsItemTooltipWrapper>
        <div className={classes.eventCardLocation}>{getEventLocation(event)}</div>
        {!hideGroupNames && event.group && <div className={classes.eventCardGroup} title={event.group.name}>
          <Link to={`/groups/${event.group._id}`}>{event.group.name}</Link>
        </div>}
        <div className={classes.addToCal}>
          <AddToCalendarButton post={event} />
        </div>
      </CardContent>
    </Card>
  })
  
  // on the EA Forum, insert card(s) advertising Virtual Programs
  if (forumTypeSetting.get() === 'EAForum' && !hideSpecialCards) {
    // NOTE: splice() will just insert the card at the end of the list if the first param > length
    if (currentUser) {
      // for logged in users, just display the In-Depth / Precipice VP card
      eventCards.splice(2, 0, <VirtualProgramCard key="advancedVP" program="advanced" />)
    } else {
      // for logged logged out users, display both VP cards
      eventCards.splice(2, 0, <VirtualProgramCard key="introVP" program="intro" />)
      // we try to space out the two cards
      eventCards.splice(5, 0, <VirtualProgramCard key="advancedVP" program="advanced" />)
    }
  }
  
  if (!eventCards.length) {
    // link to the Community page when there are no events to show
    let communityName = 'Community'
    if (forumTypeSetting.get() === 'EAForum') {
      communityName = 'EA Community'
    } else if (forumTypeSetting.get() === 'LessWrong') {
      communityName = 'LessWrong Community'
    }
    return <div className={classes.noResults}>
      <div className={classes.noResultsText}>No upcoming events matching your search</div>
      <div className={classes.noResultsCTA}>
        <Link to={'/community'} className={classes.communityLink}>
          Explore the {communityName}
        </Link>
      </div>
    </div>
  }

  return <>
    {eventCards}
  </>
}

const EventCardsComponent = registerComponent('EventCards', EventCards, {styles});

declare global {
  interface ComponentTypes {
    EventCards: typeof EventCardsComponent
  }
}
